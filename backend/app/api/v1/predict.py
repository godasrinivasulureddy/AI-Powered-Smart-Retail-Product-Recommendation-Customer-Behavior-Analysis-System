from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import UserRole
from app.core.deps import require_roles
from app.services.prediction_service import PredictionService
from app.schemas.customer import PredictPurchaseRequest, PredictPurchaseResponse
from app.schemas.envelope import Envelope

router = APIRouter()
_any_role = require_roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.VIEWER)



@router.post("/purchase", response_model=Envelope[PredictPurchaseResponse])
def predict_purchase(payload: PredictPurchaseRequest, db: Session = Depends(get_db), user=Depends(_any_role)):

    result = PredictionService(db).predict(
        customer_id=payload.customer_id,
        recency_days=payload.recency_days,
        frequency=payload.frequency,
        monetary=payload.monetary,
        avg_order_value=payload.avg_order_value,
    )
    return {"data": result, "error": None}

