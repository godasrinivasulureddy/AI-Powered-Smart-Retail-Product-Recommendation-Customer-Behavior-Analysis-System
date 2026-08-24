from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class StockCodeBlocklist(Base):
    """
    Non-product StockCodes found in Phase 0 (POST, DOT, M, C2, D, BANK CHARGES,
    ADJUST, AMAZONFEE, TEST001, CRUK, gift cards, etc). Ingestion pipeline
    filters these out before RFM/segmentation/recommendation — they are
    fees/adjustments, not purchasable products.
    """

    __tablename__ = "stockcode_blocklist"

    stock_code: Mapped[str] = mapped_column(String(32), primary_key=True)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
