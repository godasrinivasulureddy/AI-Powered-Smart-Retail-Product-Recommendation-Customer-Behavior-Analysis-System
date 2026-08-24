from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import UserRole
from app.core.deps import require_roles
from app.services.customer_service import CustomerService
from app.schemas.customer import CustomerOut, CustomerFeaturesOut, CustomerSegmentOut
from app.schemas.envelope import Envelope

router = APIRouter()
_any_role = require_roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.VIEWER)


@router.get("", response_model=Envelope[list[CustomerOut]])
def list_customers(limit: int = Query(50, le=200), offset: int = 0, db: Session = Depends(get_db), user=Depends(_any_role)):
    customers, _ = CustomerService(db).list_customers(limit, offset)
    return {"data": customers, "error": None}


@router.get("/{customer_id}", response_model=Envelope[CustomerOut])
def get_customer(customer_id: int, db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": CustomerService(db).get_customer(customer_id), "error": None}


@router.get("/{customer_id}/features", response_model=Envelope[CustomerFeaturesOut])
def get_customer_features(customer_id: int, db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": CustomerService(db).get_features(customer_id), "error": None}


@router.get("/{customer_id}/segment", response_model=Envelope[CustomerSegmentOut])
def get_customer_segment(customer_id: int, db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": CustomerService(db).get_segment(customer_id), "error": None}
