from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Customer, Product, Order, OrderItem, CustomerSegment, ModelRegistry


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def executive(self) -> dict:
        total_customers = self.db.query(func.count(Customer.id)).scalar()
        total_orders = self.db.query(func.count(Order.id)).scalar()
        total_revenue = self.db.query(func.coalesce(func.sum(Order.total_amount), 0)).scalar()
        avg_order_value = float(total_revenue) / total_orders if total_orders else 0.0
        return {
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_revenue": round(float(total_revenue), 2),
            "average_order_value": round(avg_order_value, 2),
        }

    def customers_summary(self) -> dict:
        total = self.db.query(func.count(Customer.id)).scalar()
        with_orders = self.db.query(func.count(func.distinct(Order.customer_id))).filter(Order.customer_id.isnot(None)).scalar()
        return {"total_customers": total, "customers_with_orders": with_orders}

    def segments_summary(self) -> list[dict]:
        latest_version = (
            self.db.query(CustomerSegment.model_version)
            .order_by(CustomerSegment.computed_at.desc())
            .limit(1).scalar()
        )
        if not latest_version:
            return []
        rows = (
            self.db.query(CustomerSegment.segment_label, func.count(CustomerSegment.customer_id))
            .filter(CustomerSegment.model_version == latest_version)
            .group_by(CustomerSegment.segment_label)
            .all()
        )
        total_segmented = sum(count for _, count in rows)
        color_map = {
            "High Value": "#10b981",
            "At Risk": "#f59e0b",
            "Loyal": "#3b82f6",
            "Occasional": "#8b5cf6",
        }
        return [
            {
                "segment_label": label,
                "count": count,
                "percentage": round((count / total_segmented * 100), 2) if total_segmented else 0.0,
                "color": color_map.get(label, "#6366f1"),
            }
            for label, count in rows
        ]

    def products_summary(self, limit: int = 10) -> list[dict]:
        rows = (
            self.db.query(
                Product.id,
                Product.external_id,
                Product.description,
                func.sum(OrderItem.quantity).label("units_sold"),
                func.sum(OrderItem.line_revenue).label("revenue"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .group_by(Product.id)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "product_id": r[0],
                "external_id": r[1],
                "description": r[2],
                "units_sold": int(r[3]),
                "revenue": round(float(r[4]), 2) if r[4] is not None else 0.0,
            }
            for r in rows
        ]


    def model_metrics(self) -> list[dict]:
        rows = self.db.query(ModelRegistry).filter(ModelRegistry.is_active.is_(True)).all()
        return [
            {"model_name": r.model_name, "version": r.version, "metrics": r.metrics, "trained_at": r.trained_at.isoformat()}
            for r in rows
        ]
