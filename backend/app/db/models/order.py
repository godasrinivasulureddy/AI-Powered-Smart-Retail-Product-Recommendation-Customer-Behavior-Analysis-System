from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Order(Base):
    """
    One row per Invoice — ACCEPTED POSITIVE PURCHASES ONLY.
    Cancelled/negative-quantity invoices live in `cancellations`, never here.
    is_cancelled removed: orders represents clean ML/application data by definition.
    customer_id nullable: 22.77% of source rows lack Customer ID (Phase 0).
    """

    __tablename__ = "orders"
    __table_args__ = (Index("ix_orders_customer_date", "customer_id", "order_date"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_no: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    total_amount: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    customer: Mapped["Customer"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
