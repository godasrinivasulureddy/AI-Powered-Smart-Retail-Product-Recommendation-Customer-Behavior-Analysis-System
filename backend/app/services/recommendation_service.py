import sys
from pathlib import Path
import joblib
from sqlalchemy.orm import Session

from app.db.models import ModelRegistry, Customer, Product
from app.exceptions.base import NotFoundError, ConflictError

_PROJECT_ROOT = Path(__file__).resolve().parents[3]  # backend/app/services/.. -> project root
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def _load_active_model(self):
        entry = (
            self.db.query(ModelRegistry)
            .filter(ModelRegistry.model_name == "recommendation", ModelRegistry.is_active.is_(True))
            .first()
        )
        if not entry:
            raise ConflictError("No active recommendation model registered.", code="MODEL_NOT_READY")
        return entry, joblib.load(entry.artifact_path)

    def recommend(self, customer_id: int, top_n: int = 5) -> dict:
        customer = self.db.get(Customer, customer_id)
        if not customer:
            raise NotFoundError("Customer not found.", code="CUSTOMER_NOT_FOUND")

        entry, artifact = self._load_active_model()
        item_sim = artifact["item_sim"]
        prod_idx, idx_prod = artifact["prod_idx"], artifact["idx_prod"]
        matrix, cust_idx = artifact["matrix"], artifact["cust_idx"]
        popularity = artifact["popularity"]

        # Local import to reuse the exact inference logic used during training/eval
        from ml.recommendation.train import recommend_for_customer  # noqa
        raw = recommend_for_customer(customer_id, matrix, cust_idx, item_sim, idx_prod, popularity, top_k=top_n)

        product_ids = [int(pid) for pid, _, _ in raw]
        products = {p.id: p for p in self.db.query(Product).filter(Product.id.in_(product_ids)).all()}

        from app.db.models import OrderItem
        from sqlalchemy import func
        prices = {
            r[0]: float(r[1])
            for r in self.db.query(OrderItem.product_id, func.max(OrderItem.unit_price))
            .filter(OrderItem.product_id.in_(product_ids))
            .group_by(OrderItem.product_id)
            .all()
        }


        recommendations = []
        for pid, score, reason in raw:
            product = products.get(pid)
            if not product:
                continue
            recommendations.append({
                "product_id": pid, "external_id": product.external_id,
                "description": product.description, "score": round(score, 5), "reason": reason,
                "unit_price": prices.get(pid, 0.0),
            })

        return {"customer_id": customer_id, "model_version": entry.version, "recommendations": recommendations}

