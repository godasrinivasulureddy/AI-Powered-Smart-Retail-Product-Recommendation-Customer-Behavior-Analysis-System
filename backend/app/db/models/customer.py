from datetime import date
from sqlalchemy import String, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.db.mixins import TimestampMixin


class Customer(TimestampMixin, Base):
    """
    Real customer from the dataset (Customer ID present).
    NOTE: age, gender, income, signup_date intentionally omitted (Phase 0).
    first_purchase_date is derived (earliest accepted order), not sourced directly.
    """

    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    first_purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    orders: Mapped[list["Order"]] = relationship(back_populates="customer")
