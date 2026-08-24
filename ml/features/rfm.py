"""
RFM feature computation, respecting a temporal cutoff (no future-data leakage).

Recency  = (cutoff_date - latest order_date before cutoff).days
Frequency = count of distinct orders before cutoff
Monetary  = sum(total_amount) for orders before cutoff
avg_order_value = Monetary / Frequency

Only orders (accepted positive purchases) are used — cancellations excluded
by construction (they live in a separate table, never touched here).
"""
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

import pandas as pd
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models import Order, CustomerFeature


def compute_rfm(db: Session, cutoff: datetime) -> pd.DataFrame:
    rows = (
        db.query(
            Order.customer_id,
            func.max(Order.order_date).label("last_order"),
            func.count(Order.id).label("frequency"),
            func.sum(Order.total_amount).label("monetary"),
        )
        .filter(Order.order_date < cutoff, Order.customer_id.isnot(None))
        .group_by(Order.customer_id)
        .all()
    )
    df = pd.DataFrame(rows, columns=["customer_id", "last_order", "frequency", "monetary"])
    if df.empty:
        return df
    df["recency_days"] = (cutoff - df["last_order"]).dt.days
    df["monetary"] = df["monetary"].astype(float)
    df["avg_order_value"] = df["monetary"] / df["frequency"]
    return df[["customer_id", "recency_days", "frequency", "monetary", "avg_order_value"]]


def persist_features(db: Session, rfm_df: pd.DataFrame) -> int:
    db.query(CustomerFeature).delete()  # recompute fresh each run (small table, simple + correct)
    rows = [
        dict(
            customer_id=int(r.customer_id),
            recency_days=int(r.recency_days),
            frequency=int(r.frequency),
            monetary=round(float(r.monetary), 2),
            avg_order_value=round(float(r.avg_order_value), 2),
        )
        for r in rfm_df.itertuples(index=False)
    ]
    if rows:
        db.bulk_insert_mappings(CustomerFeature, rows)
    db.commit()
    return len(rows)


if __name__ == "__main__":
    db = SessionLocal()
    try:
        cutoff = db.query(func.max(Order.order_date)).scalar()
        rfm_df = compute_rfm(db, cutoff)
        n = persist_features(db, rfm_df)
        print(f"cutoff: {cutoff}")
        print(f"customers_with_features: {n}")
    finally:
        db.close()
