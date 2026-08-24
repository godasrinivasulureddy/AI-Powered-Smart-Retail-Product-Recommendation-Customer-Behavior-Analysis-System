"""
Recommendation engine: item-item collaborative filtering (co-purchase
similarity) with popularity fallback for cold-start customers.

No content-based recommendation (Phase 0: no reliable product taxonomy).
No LLM-generated explanations — reasons are deterministic, derived from
actual interaction data.

Evaluated via temporal holdout: train on orders before cutoff, evaluate
whether held-out (post-cutoff) purchases appear in the top-K recommendations.
"""
import sys
from pathlib import Path
from datetime import timedelta, datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

import numpy as np
import pandas as pd
import joblib
from scipy.sparse import csr_matrix
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy import func

from app.db.session import SessionLocal
from app.db.models import Order, OrderItem, Product, ModelRegistry

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "models"
ARTIFACT_DIR.mkdir(exist_ok=True)
TOP_K = 5


def load_interactions(db, before: datetime | None = None):
    q = (
        db.query(Order.customer_id, OrderItem.product_id)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .filter(Order.customer_id.isnot(None))
    )
    if before is not None:
        q = q.filter(Order.order_date < before)
    rows = q.all()
    return pd.DataFrame(rows, columns=["customer_id", "product_id"])


def build_item_item_similarity(interactions: pd.DataFrame):
    customers = interactions["customer_id"].unique()
    products = interactions["product_id"].unique()
    cust_idx = {c: i for i, c in enumerate(customers)}
    prod_idx = {p: i for i, p in enumerate(products)}

    rows = interactions["customer_id"].map(cust_idx)
    cols = interactions["product_id"].map(prod_idx)
    data = np.ones(len(interactions))
    matrix = csr_matrix((data, (rows, cols)), shape=(len(customers), len(products)))

    item_sim = cosine_similarity(matrix.T, dense_output=False)
    return item_sim, prod_idx, {i: p for p, i in prod_idx.items()}, matrix, cust_idx


def popularity_ranking(interactions: pd.DataFrame) -> list[int]:
    return interactions["product_id"].value_counts().index.tolist()


def recommend_for_customer(customer_id, matrix, cust_idx, item_sim, idx_prod, popularity, top_k=TOP_K):
    if customer_id not in cust_idx:
        return [(pid, 0.0, "Popular product (cold-start: no purchase history yet)") for pid in popularity[:top_k]]

    row = matrix[cust_idx[customer_id]]
    purchased_idx = row.indices
    if len(purchased_idx) == 0:
        return [(pid, 0.0, "Popular product (cold-start: no purchase history yet)") for pid in popularity[:top_k]]

    scores = np.asarray(item_sim[purchased_idx].sum(axis=0)).flatten()
    scores[purchased_idx] = -1  # exclude already-purchased
    top_indices = np.argsort(scores)[::-1][:top_k]

    out = []
    for i in top_indices:
        if scores[i] <= 0:
            continue
        anchor_idx = purchased_idx[np.argmax(item_sim[purchased_idx, i].toarray().flatten())]
        anchor_pid = idx_prod[anchor_idx]
        out.append((idx_prod[i], float(scores[i]), f"Frequently co-purchased with product {anchor_pid}"))
    if len(out) < top_k:
        seen = {p for p, _, _ in out} | set(idx_prod[i] for i in purchased_idx)
        for pid in popularity:
            if pid not in seen:
                out.append((pid, 0.0, "Popular product (fallback)"))
                seen.add(pid)
            if len(out) >= top_k:
                break
    return out


def evaluate_holdout(db, cutoff: datetime, item_sim, prod_idx, idx_prod, matrix, cust_idx, popularity, k=TOP_K):
    """Precision@K / Recall@K / HitRate@K against actual post-cutoff purchases."""
    future = load_interactions(db, before=None)
    future_orders = (
        db.query(Order.customer_id, OrderItem.product_id)
        .join(OrderItem, OrderItem.order_id == Order.id)
        .filter(Order.order_date >= cutoff, Order.customer_id.isnot(None))
        .all()
    )
    future_df = pd.DataFrame(future_orders, columns=["customer_id", "product_id"])
    if future_df.empty:
        return {"note": "No post-cutoff interactions available for holdout evaluation."}

    actual_by_customer = future_df.groupby("customer_id")["product_id"].apply(set).to_dict()

    precisions, recalls, hits = [], [], []
    eval_customers = [c for c in actual_by_customer if c in cust_idx][:500]  # cap for speed
    for cid in eval_customers:
        recs = recommend_for_customer(cid, matrix, cust_idx, item_sim, idx_prod, popularity, top_k=k)
        rec_ids = {r[0] for r in recs}
        actual = actual_by_customer[cid]
        hit = len(rec_ids & actual) > 0
        precisions.append(len(rec_ids & actual) / k)
        recalls.append(len(rec_ids & actual) / len(actual) if actual else 0)
        hits.append(hit)

    all_recommended = set()
    for cid in list(cust_idx.keys())[:500]:
        recs = recommend_for_customer(cid, matrix, cust_idx, item_sim, idx_prod, popularity, top_k=k)
        all_recommended |= {r[0] for r in recs}
    coverage = len(all_recommended) / len(prod_idx) if prod_idx else 0

    return {
        f"precision_at_{k}": round(float(np.mean(precisions)), 4) if precisions else None,
        f"recall_at_{k}": round(float(np.mean(recalls)), 4) if recalls else None,
        f"hit_rate_at_{k}": round(float(np.mean(hits)), 4) if hits else None,
        "coverage": round(coverage, 4),
        "n_customers_evaluated": len(eval_customers),
    }


def run() -> dict:
    db = SessionLocal()
    try:
        max_date = db.query(func.max(Order.order_date)).scalar()
        cutoff = max_date - timedelta(days=30)

        train_interactions = load_interactions(db, before=cutoff)
        if train_interactions.empty:
            raise RuntimeError("No training interactions available.")

        item_sim, prod_idx, idx_prod, matrix, cust_idx = build_item_item_similarity(train_interactions)
        popularity = popularity_ranking(train_interactions)

        eval_metrics = evaluate_holdout(db, cutoff, item_sim, prod_idx, idx_prod, matrix, cust_idx, popularity)

        version = f"item_cf_v{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        model_path = ARTIFACT_DIR / f"{version}.joblib"
        joblib.dump({
            "item_sim": item_sim, "prod_idx": prod_idx, "idx_prod": idx_prod,
            "matrix": matrix, "cust_idx": cust_idx, "popularity": popularity,
        }, model_path)

        db.query(ModelRegistry).filter(ModelRegistry.model_name == "recommendation").update({"is_active": False})
        db.add(ModelRegistry(
            model_name="recommendation", version=version,
            metrics={**eval_metrics, "cutoff": cutoff.isoformat(), "n_products": len(prod_idx), "n_customers": len(cust_idx)},
            artifact_path=str(model_path), is_active=True,
        ))
        db.commit()

        return {"cutoff": str(cutoff), "n_products": len(prod_idx), "n_customers_train": len(cust_idx),
                "eval_metrics": eval_metrics, "model_version": version}
    finally:
        db.close()


if __name__ == "__main__":
    result = run()
    for k, v in result.items():
        print(f"{k}: {v}")
