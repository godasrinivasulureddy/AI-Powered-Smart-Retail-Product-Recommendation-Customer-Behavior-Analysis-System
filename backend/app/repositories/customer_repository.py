from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models import Customer, CustomerFeature, CustomerSegment, Order


class CustomerRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self, limit: int = 50, offset: int = 0):
        customers = self.db.query(Customer).order_by(Customer.id).offset(offset).limit(limit).all()
        if not customers:
            return []
        customer_ids = [c.id for c in customers]
        features_map = {
            f.customer_id: f for f in self.db.query(CustomerFeature).filter(CustomerFeature.customer_id.in_(customer_ids)).all()
        }
        latest_seg_version = (
            self.db.query(CustomerSegment.model_version)
            .order_by(CustomerSegment.computed_at.desc())
            .limit(1).scalar()
        )
        segments_map = {}
        if latest_seg_version:
            segments_map = {
                s.customer_id: s for s in self.db.query(CustomerSegment)
                .filter(CustomerSegment.customer_id.in_(customer_ids), CustomerSegment.model_version == latest_seg_version).all()
            }
        for c in customers:
            c.features = features_map.get(c.id)
            c.segment = segments_map.get(c.id)
        return customers

    def count(self) -> int:
        return self.db.query(func.count(Customer.id)).scalar()

    def get(self, customer_id: int) -> Customer | None:
        c = self.db.get(Customer, customer_id)
        if c:
            c.features = self.get_features(customer_id)
            c.segment = self.get_latest_segment(customer_id)
        return c


    def get_features(self, customer_id: int) -> CustomerFeature | None:
        return self.db.get(CustomerFeature, customer_id)

    def get_latest_segment(self, customer_id: int) -> CustomerSegment | None:
        return (
            self.db.query(CustomerSegment)
            .filter(CustomerSegment.customer_id == customer_id)
            .order_by(CustomerSegment.computed_at.desc())
            .first()
        )
