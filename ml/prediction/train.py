"""
Purchase prediction: will_purchase_next_30_days.

Temporal construction (no random split, no future leakage):
  cutoff = max(order_date) - 30 days
  features: RFM computed on orders strictly BEFORE cutoff
  target:   1 if customer has >=1 order in [cutoff, cutoff+30d), else 0
  eligibility: only customers with >=1 order before cutoff (else no valid features)

Train/test: chronological hold-out is not meaningful with a single 30-day
window on this dataset size, so we use stratified random split ON THE
ELIGIBLE-CUSTOMER FEATURE SET (features/target already temporally separated
by construction -- this is not leaking future rows into training, it only
partitions *customers* for evaluation of the already-correctly-labeled set).
"""
import sys
from pathlib import Path
from datetime import timedelta, datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

import numpy as np
import pandas as pd
import joblib
from sqlalchemy import func
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, average_precision_score, confusion_matrix

from app.db.session import SessionLocal
from app.db.models import Order, ModelRegistry

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "models"
ARTIFACT_DIR.mkdir(exist_ok=True)


def build_dataset(db, cutoff: datetime, horizon_days: int = 30) -> pd.DataFrame:
    horizon_end = cutoff + timedelta(days=horizon_days)

    hist_rows = (
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
    hist = pd.DataFrame(hist_rows, columns=["customer_id", "last_order", "frequency", "monetary"])
    if hist.empty:
        return hist
    hist["recency_days"] = (cutoff - hist["last_order"]).dt.days
    hist["monetary"] = hist["monetary"].astype(float)
    hist["avg_order_value"] = hist["monetary"] / hist["frequency"]

    future_customers = {
        r[0] for r in db.query(Order.customer_id)
        .filter(Order.order_date >= cutoff, Order.order_date < horizon_end, Order.customer_id.isnot(None))
        .distinct().all()
    }
    hist["target"] = hist["customer_id"].isin(future_customers).astype(int)
    return hist[["customer_id", "recency_days", "frequency", "monetary", "avg_order_value", "target"]]


def train_and_evaluate(df: pd.DataFrame) -> dict:
    X = df[["recency_days", "frequency", "monetary", "avg_order_value"]].astype(float)
    y = df["target"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)

    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
        "random_forest": RandomForestClassifier(n_estimators=200, max_depth=8, class_weight="balanced", random_state=42),
    }

    results = {}
    fitted = {}
    for name, model in models.items():
        model.fit(X_train_s, y_train)
        proba = model.predict_proba(X_test_s)[:, 1]
        pred = (proba >= 0.5).astype(int)
        results[name] = {
            "precision": round(precision_score(y_test, pred, zero_division=0), 4),
            "recall": round(recall_score(y_test, pred, zero_division=0), 4),
            "f1": round(f1_score(y_test, pred, zero_division=0), 4),
            "roc_auc": round(roc_auc_score(y_test, proba), 4),
            "pr_auc": round(average_precision_score(y_test, proba), 4),
            "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
        }
        fitted[name] = model

    winner = max(results, key=lambda k: results[k]["f1"])
    return {"results": results, "winner": winner, "fitted": fitted, "scaler": scaler,
            "train_size": len(X_train), "test_size": len(X_test),
            "positive_rate": round(float(y.mean()), 4)}


def run() -> dict:
    db = SessionLocal()
    try:
        max_date = db.query(func.max(Order.order_date)).scalar()
        cutoff = max_date - timedelta(days=30)

        df = build_dataset(db, cutoff)
        if df.empty or df["target"].nunique() < 2:
            raise RuntimeError("Insufficient data / single-class target -- cannot train (no workaround permitted).")

        outcome = train_and_evaluate(df)
        winner_name = outcome["winner"]
        winner_metrics = outcome["results"][winner_name]

        version = f"{winner_name}_v{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        model_path = ARTIFACT_DIR / f"{version}.joblib"
        joblib.dump({"model": outcome["fitted"][winner_name], "scaler": outcome["scaler"],
                     "features": ["recency_days", "frequency", "monetary", "avg_order_value"]}, model_path)

        db.query(ModelRegistry).filter(ModelRegistry.model_name == "purchase_prediction").update({"is_active": False})
        db.add(ModelRegistry(
            model_name="purchase_prediction", version=version,
            metrics={"winner": winner_name, "all_models": outcome["results"],
                     "cutoff": cutoff.isoformat(), "positive_rate": outcome["positive_rate"],
                     "train_size": outcome["train_size"], "test_size": outcome["test_size"]},
            artifact_path=str(model_path), is_active=True,
        ))
        db.commit()

        return {"cutoff": str(cutoff), "eligible_customers": len(df), "positive_rate": outcome["positive_rate"],
                "train_size": outcome["train_size"], "test_size": outcome["test_size"],
                "winner": winner_name, "winner_metrics": winner_metrics, "all_results": outcome["results"]}
    finally:
        db.close()


if __name__ == "__main__":
    result = run()
    for k, v in result.items():
        print(f"{k}: {v}")
