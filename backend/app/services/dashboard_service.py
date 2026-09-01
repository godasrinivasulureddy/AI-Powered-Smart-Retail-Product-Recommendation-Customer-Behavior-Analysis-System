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

    def monthly_sales_summary(self) -> list[dict]:
        rows = (
            self.db.query(
                func.to_char(Order.order_date, 'YYYY-MM').label('month'),
                func.sum(Order.total_amount).label('revenue'),
                func.count(Order.id).label('orders'),
            )
            .group_by('month')
            .order_by('month')
            .all()
        )
        return [
            {
                "month": r[0],
                "revenue": round(float(r[1]), 2) if r[1] is not None else 0.0,
                "orders": int(r[2]),
            }
            for r in rows
        ]

    def country_sales_summary(self, limit: int = 8) -> list[dict]:
        rows = (
            self.db.query(
                Order.country,
                func.sum(Order.total_amount).label('revenue'),
                func.count(Order.id).label('orders'),
                func.count(func.distinct(Order.customer_id)).label('customers'),
            )
            .filter(Order.country.isnot(None))
            .group_by(Order.country)
            .order_by(func.sum(Order.total_amount).desc())
            .limit(limit)
            .all()
        )
        return [
            {
                "country": r[0],
                "revenue": round(float(r[1]), 2) if r[1] is not None else 0.0,
                "orders": int(r[2]),
                "customers": int(r[3]),
            }
            for r in rows
        ]

    def rfm_summary(self) -> dict:
        from app.db.models import CustomerFeature
        r = (
            self.db.query(
                func.avg(CustomerFeature.recency_days).label('avg_recency'),
                func.avg(CustomerFeature.frequency).label('avg_frequency'),
                func.avg(CustomerFeature.monetary).label('avg_monetary'),
                func.avg(CustomerFeature.avg_order_value).label('avg_aov'),
                func.min(CustomerFeature.recency_days).label('min_recency'),
                func.max(CustomerFeature.recency_days).label('max_recency'),
                func.min(CustomerFeature.frequency).label('min_frequency'),
                func.max(CustomerFeature.frequency).label('max_frequency'),
                func.min(CustomerFeature.monetary).label('min_monetary'),
                func.max(CustomerFeature.monetary).label('max_monetary'),
            )
            .first()
        )
        if not r or r[0] is None:
            return {}
        return {
            "avg_recency": round(float(r[0]), 1),
            "avg_frequency": round(float(r[1]), 1),
            "avg_monetary": round(float(r[2]), 2),
            "avg_aov": round(float(r[3]), 2),
            "min_recency": int(r[4]),
            "max_recency": int(r[5]),
            "min_frequency": int(r[6]),
            "max_frequency": int(r[7]),
            "min_monetary": round(float(r[8]), 2),
            "max_monetary": round(float(r[9]), 2),
        }

