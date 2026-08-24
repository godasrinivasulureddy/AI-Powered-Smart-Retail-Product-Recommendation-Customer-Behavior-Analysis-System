from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Cancellation(Base):
    """
    Raw cancelled/negative-quantity transactions, kept for analytics only.
    No FKs to customers/products: rows may have missing Customer ID or
    filtered/non-product StockCodes (Phase 0 finding) — must not be forced
    into the clean relational schema.
    """

    __tablename__ = "cancellations"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_invoice_id: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    stock_code: Mapped[str] = mapped_column(String(32), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_external_id: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    invoice_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cancellation_type: Mapped[str] = mapped_column(String(30), nullable=False)  # e.g. "C_INVOICE" | "NEGATIVE_QTY"
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
