from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import UserRole
from app.core.deps import require_roles
from app.services.recommendation_service import RecommendationService
from app.schemas.customer import RecommendRequest, RecommendResponse
from app.schemas.envelope import Envelope

router = APIRouter()
_any_role = require_roles(UserRole.ADMIN, UserRole.ANALYST, UserRole.VIEWER)


@router.post("", response_model=Envelope[RecommendResponse])
def recommend(payload: RecommendRequest, db: Session = Depends(get_db), user=Depends(_any_role)):


    return {"data": RecommendationService(db).recommend(payload.customer_id, payload.top_n), "error": None}

