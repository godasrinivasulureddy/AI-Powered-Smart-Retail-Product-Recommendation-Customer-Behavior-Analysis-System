from sqlalchemy.orm import Session

from app.repositories.customer_repository import CustomerRepository
from app.exceptions.base import NotFoundError


class CustomerService:
    def __init__(self, db: Session):
        self.repo = CustomerRepository(db)

    def list_customers(self, limit: int, offset: int):
        return self.repo.list(limit, offset), self.repo.count()

    def get_customer(self, customer_id: int):
        c = self.repo.get(customer_id)
        if not c:
            raise NotFoundError("Customer not found.", code="CUSTOMER_NOT_FOUND")
        return c

    def get_features(self, customer_id: int):
        self.get_customer(customer_id)  # 404 if customer itself doesn't exist
        f = self.repo.get_features(customer_id)
        if not f:
            raise NotFoundError("No features computed for this customer yet.", code="FEATURES_NOT_FOUND")
        return f

    def get_segment(self, customer_id: int):
        self.get_customer(customer_id)
        s = self.repo.get_latest_segment(customer_id)
        if not s:
            raise NotFoundError("No segment assigned for this customer yet.", code="SEGMENT_NOT_FOUND")
        return s
