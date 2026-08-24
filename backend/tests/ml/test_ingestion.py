import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))
from ml.preprocessing.ingest import dedupe_exact_overlap, BLOCKLIST


def _row(invoice, sheet, stock="85123A", qty=1, price=1.0, cust=100.0):
    return dict(
        Invoice=invoice, StockCode=stock, Description="X", Quantity=qty,
        InvoiceDate=pd.Timestamp("2010-12-01"), Price=price, **{"Customer ID": cust},
        Country="United Kingdom", __sheet__=sheet,
    )


def test_dedup_removes_only_cross_sheet_overlap():
    df = pd.DataFrame([
        _row("536576", "2009-2010"),
        _row("536576", "2010-2011"),  # exact cross-sheet duplicate -> should drop the 2009-2010 copy
        _row("999999", "2010-2011"),  # unique, unrelated invoice
    ])
    out, removed = dedupe_exact_overlap(df)
    assert removed == 1
    assert len(out) == 2
    assert (out["__sheet__"] == "2009-2010").sum() == 0  # older copy of overlap invoice gone


def test_dedup_preserves_intra_sheet_duplicate_line_items():
    # Two rows, same sheet, identical values -- must NOT be collapsed (Phase 0 caution)
    df = pd.DataFrame([
        _row("536577", "2010-2011"),
        _row("536577", "2010-2011"),  # legitimate repeated line, same sheet
    ])
    out, removed = dedupe_exact_overlap(df)
    assert removed == 0
    assert len(out) == 2


def test_blocklist_contains_verified_non_product_codes():
    for code in ["POST", "DOT", "M", "C2", "D", "BANK CHARGES", "ADJUST", "AMAZONFEE", "TEST001", "CRUK", "B"]:
        assert code in BLOCKLIST
    assert "gift_0001_20" in BLOCKLIST


def test_blocklist_does_not_exclude_real_products():
    # PADS and DCGS* codes were verified as real products in Phase 0/2 analysis
    assert "PADS" not in BLOCKLIST
    assert "DCGS0058" not in BLOCKLIST
