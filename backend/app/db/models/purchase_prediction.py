from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, Boolean, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class PurchasePrediction(Base):
    """
    probability = raw classifier output. Never labeled "confidence" unless
    calibrated (spec section 11) — calibration not implemented yet.
    """

    __tablename__ = "purchase_predictions"
    __table_args__ = (Index("ix_purchase_predictions_customer_time", "customer_id", "predicted_at"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    probability: Mapped[float] = mapped_column(Numeric(6, 5), nullable=False)
    prediction: Mapped[bool] = mapped_column(Boolean, nullable=False)
    predicted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
