"""
Reproducible ingestion pipeline: UCI Online Retail II -> PostgreSQL.

Run: python -m ml.preprocessing.ingest --file ml/data/online_retail_II.xlsx

Pipeline (per Phase 0 findings, approved by ChatGPT architecture review):
  Excel (2 sheets)
    -> combine
    -> exact full-row dedup (22,523 known overlap rows, keep later-sheet copy)
    -> split: cancellations (C-invoice OR negative qty) vs positive rows
    -> filter non-product StockCodes (evidence-based blocklist, see below)
    -> filter zero/negative price rows from positive set (invalid, logged, excluded)
    -> load: customers, products, orders, order_items
    -> load: cancellations (raw, no FK, analytics only)
    -> compute customers.first_purchase_date
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

import pandas as pd
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import Customer, Product, Order, OrderItem, Cancellation, StockCodeBlocklist

# Evidence-based blocklist: verified via Description inspection in Phase 0/2 analysis.
# NOT a blanket "non-numeric StockCode" rule — PADS and DCGS* codes are real
# products with alphanumeric codes and were checked individually.
BLOCKLIST = {
    "POST": "Postage fee, not a product",
    "DOT": "Dotcom postage fee, not a product",
    "M": "Manual adjustment entry",
    "m": "Manual adjustment entry (case variant)",
    "C2": "Carriage fee, not a product",
    "C3": "Carriage-related code, no description, not a product",
    "D": "Discount line item, not a product",
    "S": "Samples entry, not a product",
    "BANK CHARGES": "Bank charge entry, not a product",
    "ADJUST": "Manual accounting adjustment, not a product",
    "AMAZONFEE": "Amazon marketplace fee, not a product",
    "CRUK": "Charity commission entry, not a product",
    "TEST001": "Test data row, not a real product",
    "B": "Bad debt adjustment, not a product",
}
BLOCKLIST.update({f"gift_0001_{n}": "Gift voucher, not a physical product"
                   for n in ["10", "20", "30", "40", "50", "60", "70", "80", "90"]})


def load_raw(path: str) -> pd.DataFrame:
    s1 = pd.read_excel(path, sheet_name="Year 2009-2010")
    s2 = pd.read_excel(path, sheet_name="Year 2010-2011")
    s1["__sheet__"] = "2009-2010"
    s2["__sheet__"] = "2010-2011"
    return pd.concat([s1, s2], ignore_index=True)


def dedupe_exact_overlap(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """Drop ONLY the verified cross-sheet overlap: invoices appearing in both
    sheets whose rows are a 100% exact re-export (confirmed in Phase 0 audit
    via full outer merge — every column matched, no partial matches).

    Deliberately scoped to overlap invoices only: a blanket
    drop_duplicates(subset=all_columns) across the whole combined frame would
    ALSO collapse intra-sheet duplicate line items (verified separately:
    13,283 in 2009-2010 alone, 10,147 in 2010-2011) which have not been
    verified as data-entry errors vs. legitimate repeated purchases —
    collapsing those was flagged as a leakage/data-loss risk and rejected.
    """
    overlap_invoices = set(df[df["__sheet__"] == "2009-2010"]["Invoice"]) & set(
        df[df["__sheet__"] == "2010-2011"]["Invoice"]
    )
    before = len(df)
    # Drop the older sheet's copy of overlap invoices; keep 2010-2011's copy.
    drop_mask = (df["__sheet__"] == "2009-2010") & (df["Invoice"].isin(overlap_invoices))
    df = df[~drop_mask]
    return df, int(drop_mask.sum())


def run_pipeline(path: str) -> dict:
    stats = {}
    df = load_raw(path)
    stats["raw_rows"] = len(df)

    df, n_dupes = dedupe_exact_overlap(df)
    stats["duplicates_removed"] = n_dupes

    df["Invoice"] = df["Invoice"].astype(str)
    df["StockCode"] = df["StockCode"].astype(str)
    is_cancel_invoice = df["Invoice"].str.startswith("C")
    is_negative_qty = df["Quantity"] < 0
    cancel_mask = is_cancel_invoice | is_negative_qty

    cancellations = df[cancel_mask].copy()
    positive = df[~cancel_mask].copy()
    stats["cancellations_separated"] = len(cancellations)

    # Filter non-product StockCodes from the positive set (blocklist)
    blocklisted_mask = positive["StockCode"].isin(BLOCKLIST.keys())
    stats["non_product_rows_removed"] = int(blocklisted_mask.sum())
    positive = positive[~blocklisted_mask]

    # Invalid price rows (zero/negative) among positive rows: exclude, log
    invalid_price_mask = positive["Price"] <= 0
    stats["invalid_price_rows_removed"] = int(invalid_price_mask.sum())
    positive = positive[~invalid_price_mask]

    stats["final_clean_rows"] = len(positive)

    db = SessionLocal()
    try:
        _load_blocklist(db)
        _load_cancellations(db, cancellations)
        _load_positive(db, positive)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    return stats


def _load_blocklist(db: Session) -> None:
    existing = {r.stock_code for r in db.query(StockCodeBlocklist.stock_code).all()}
    for code, reason in BLOCKLIST.items():
        if code not in existing:
            db.add(StockCodeBlocklist(stock_code=code, reason=reason))
    db.flush()


def _load_cancellations(db: Session, cancellations: pd.DataFrame) -> None:
    rows = []
    for r in cancellations.itertuples(index=False):
        cust_id = None if pd.isna(r._6) else str(int(r._6)) if float(r._6).is_integer() else str(r._6)
        rows.append(dict(
            external_invoice_id=r.Invoice,
            stock_code=r.StockCode,
            description=None if pd.isna(r.Description) else str(r.Description),
            customer_external_id=cust_id,
            invoice_date=r.InvoiceDate,
            quantity=int(r.Quantity),
            unit_price=float(r.Price),
            country=None if pd.isna(r.Country) else str(r.Country),
            cancellation_type="C_INVOICE" if str(r.Invoice).startswith("C") else "NEGATIVE_QTY",
        ))
    if rows:
        db.bulk_insert_mappings(Cancellation, rows)


def _load_positive(db: Session, positive: pd.DataFrame) -> None:
    positive = positive.copy()
    positive["CustomerIdStr"] = positive["Customer ID"].apply(
        lambda v: None if pd.isna(v) else str(int(v))
    )

    # Customers
    cust_ids = sorted(positive["CustomerIdStr"].dropna().unique())
    cust_country = positive.dropna(subset=["CustomerIdStr"]).groupby("CustomerIdStr")["Country"].first()
    existing_customers = {c.external_id: c.id for c in db.query(Customer.id, Customer.external_id).all()}
    new_customers = [
        dict(external_id=cid, country=cust_country.get(cid))
        for cid in cust_ids if cid not in existing_customers
    ]
    if new_customers:
        db.bulk_insert_mappings(Customer, new_customers)
        db.flush()
    customer_id_map = {c.external_id: c.id for c in db.query(Customer.id, Customer.external_id).all()}

    # Products
    prod_codes = sorted(positive["StockCode"].unique())
    prod_desc = positive.groupby("StockCode")["Description"].first()
    existing_products = {p.external_id: p.id for p in db.query(Product.id, Product.external_id).all()}
    new_products = [
        dict(external_id=code, description=(None if pd.isna(prod_desc.get(code)) else str(prod_desc.get(code))))
        for code in prod_codes if code not in existing_products
    ]
    if new_products:
        db.bulk_insert_mappings(Product, new_products)
        db.flush()
    product_id_map = {p.external_id: p.id for p in db.query(Product.id, Product.external_id).all()}

    # Orders (one per Invoice)
    positive["Revenue"] = positive["Quantity"] * positive["Price"]
    order_agg = positive.groupby("Invoice").agg(
        order_date=("InvoiceDate", "min"),
        country=("Country", "first"),
        customer=("CustomerIdStr", "first"),
        total_amount=("Revenue", "sum"),
    )
    existing_orders = {o.invoice_no: o.id for o in db.query(Order.id, Order.invoice_no).all()}
    new_orders = [
        dict(
            invoice_no=inv,
            customer_id=customer_id_map.get(row.customer),
            order_date=row.order_date,
            country=None if pd.isna(row.country) else row.country,
            total_amount=round(row.total_amount, 2),
        )
        for inv, row in order_agg.iterrows() if inv not in existing_orders
    ]
    if new_orders:
        db.bulk_insert_mappings(Order, new_orders)
        db.flush()
    order_id_map = {o.invoice_no: o.id for o in db.query(Order.id, Order.invoice_no).all()}

    # Order items
    items = [
        dict(
            order_id=order_id_map[r.Invoice],
            product_id=product_id_map[r.StockCode],
            quantity=int(r.Quantity),
            unit_price=float(r.Price),
            line_revenue=round(float(r.Quantity) * float(r.Price), 2),
        )
        for r in positive.itertuples(index=False)
    ]
    if items:
        db.bulk_insert_mappings(OrderItem, items)

    # first_purchase_date per customer
    db.flush()
    first_purchase = positive.dropna(subset=["CustomerIdStr"]).groupby("CustomerIdStr")["InvoiceDate"].min()
    for cid, dt in first_purchase.items():
        cust_pk = customer_id_map.get(cid)
        if cust_pk:
            db.query(Customer).filter(Customer.id == cust_pk).update({"first_purchase_date": dt.date()})


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", required=True)
    args = parser.parse_args()
    result = run_pipeline(args.file)
    for k, v in result.items():
        print(f"{k}: {v}")
