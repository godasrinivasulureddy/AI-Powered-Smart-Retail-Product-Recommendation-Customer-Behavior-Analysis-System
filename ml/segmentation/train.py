"""
Customer segmentation: RFM -> log-transform -> scale -> K-Means.
K chosen via silhouette score across candidates (no fabricated metric).
Labels assigned from actual cluster centroid characteristics post-hoc.
"""
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

from app.db.session import SessionLocal
from app.db.models import CustomerFeature, CustomerSegment, ModelRegistry

ARTIFACT_DIR = Path(__file__).resolve().parents[1] / "models"
ARTIFACT_DIR.mkdir(exist_ok=True)


def load_rfm(db) -> pd.DataFrame:
    rows = db.query(
        CustomerFeature.customer_id, CustomerFeature.recency_days,
        CustomerFeature.frequency, CustomerFeature.monetary,
    ).all()
    return pd.DataFrame(rows, columns=["customer_id", "recency_days", "frequency", "monetary"])


def select_k(X_scaled: np.ndarray, k_range=range(2, 8)) -> tuple[int, dict]:
    scores = {}
    for k in k_range:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(X_scaled)
        scores[k] = silhouette_score(X_scaled, labels)
    best_k = max(scores, key=scores.get)
    return best_k, scores


def label_clusters(df: pd.DataFrame) -> dict[int, str]:
    """Label from actual centroid characteristics, not fabricated business names."""
    profile = df.groupby("cluster")[["recency_days", "frequency", "monetary"]].mean()
    labels = {}
    monetary_rank = profile["monetary"].rank(ascending=False)
    recency_rank = profile["recency_days"].rank(ascending=True)
    n = len(profile)
    for cluster_id, row in profile.iterrows():
        m_rank, r_rank = monetary_rank[cluster_id], recency_rank[cluster_id]
        if m_rank == 1 and r_rank <= n / 2:
            labels[cluster_id] = "High Value"
        elif r_rank == n:
            labels[cluster_id] = "At Risk"
        elif row["frequency"] <= profile["frequency"].median():
            labels[cluster_id] = "Occasional"
        else:
            labels[cluster_id] = "Loyal"
    return labels


def run_segmentation() -> dict:
    db = SessionLocal()
    try:
        df = load_rfm(db)
        if df.empty:
            raise RuntimeError("No customer_features found - run RFM (Part D) first.")

        X = df[["recency_days", "frequency", "monetary"]].astype(float).copy()
        X_log = np.log1p(X)
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_log)

        best_k, silhouette_scores = select_k(X_scaled)
        km = KMeans(n_clusters=best_k, random_state=42, n_init=10)
        df["cluster"] = km.fit_predict(X_scaled)

        cluster_labels = label_clusters(df)
        df["segment_label"] = df["cluster"].map(cluster_labels)

        version = f"kmeans_v{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        model_path = ARTIFACT_DIR / f"{version}.joblib"
        joblib.dump({"scaler": scaler, "kmeans": km, "cluster_labels": cluster_labels}, model_path)

        db.query(CustomerSegment).delete()
        db.bulk_insert_mappings(CustomerSegment, [
            dict(customer_id=int(r.customer_id), model_version=version, segment_label=r.segment_label)
            for r in df.itertuples(index=False)
        ])

        metrics = {
            "k": best_k,
            "silhouette_score": round(silhouette_scores[best_k], 4),
            "silhouette_by_k": {str(k): round(v, 4) for k, v in silhouette_scores.items()},
            "n_customers": len(df),
            "cluster_sizes": {str(k): int(v) for k, v in df["segment_label"].value_counts().to_dict().items()},
        }
        db.query(ModelRegistry).filter(ModelRegistry.model_name == "customer_segmentation").update({"is_active": False})
        db.add(ModelRegistry(
            model_name="customer_segmentation", version=version, metrics=metrics,
            artifact_path=str(model_path), is_active=True,
        ))
        db.commit()
        return metrics
    finally:
        db.close()


if __name__ == "__main__":
    result = run_segmentation()
    for k, v in result.items():
        print(f"{k}: {v}")
