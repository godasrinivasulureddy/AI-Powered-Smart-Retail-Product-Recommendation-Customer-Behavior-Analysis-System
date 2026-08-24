from datetime import datetime
from sqlalchemy import Integer, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CustomerFeature(Base):
    """
    Precomputed RFM + derived features. One row per customer, recomputed
    on each pipeline run (last_computed_at tracks freshness).
    No category_preference field — no product category exists (Phase 0).
    """

    __tablename__ = "customer_features"

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), primary_key=True)
    recency_days: Mapped[int] = mapped_column(Integer, nullable=False)
    frequency: Mapped[int] = mapped_column(Integer, nullable=False)
    monetary: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    avg_order_value: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    last_computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
