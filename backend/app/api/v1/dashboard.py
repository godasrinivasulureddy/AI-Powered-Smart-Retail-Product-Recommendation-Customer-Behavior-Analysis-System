from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import UserRole
from app.core.deps import require_roles
from app.services.dashboard_service import DashboardService
from app.schemas.envelope import Envelope

router = APIRouter()
_any_role = require_roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.VIEWER)


@router.get("/executive", response_model=Envelope[dict])
def executive(db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": DashboardService(db).executive(), "error": None}


@router.get("/customers", response_model=Envelope[dict])
def customers(db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": DashboardService(db).customers_summary(), "error": None}


@router.get("/segments", response_model=Envelope[list])
def segments(db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": DashboardService(db).segments_summary(), "error": None}


@router.get("/products", response_model=Envelope[list])
def products(db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": DashboardService(db).products_summary(), "error": None}


@router.get("/model-metrics", response_model=Envelope[list])
def model_metrics(db: Session = Depends(get_db), user=Depends(_any_role)):
    return {"data": DashboardService(db).model_metrics(), "error": None}



