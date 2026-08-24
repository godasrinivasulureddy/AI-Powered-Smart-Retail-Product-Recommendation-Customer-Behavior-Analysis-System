from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class CustomerSegment(Base):
    """
    A customer can have one segment label per model_version — re-running
    K-Means with a new version does not overwrite history.
    """

    __tablename__ = "customer_segments"

    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), primary_key=True)
    model_version: Mapped[str] = mapped_column(String(50), primary_key=True)
    segment_label: Mapped[str] = mapped_column(String(50), nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
