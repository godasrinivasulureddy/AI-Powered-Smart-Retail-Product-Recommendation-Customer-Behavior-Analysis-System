from fastapi import APIRouter

from app.api.v1 import health, auth, customers, predict, recommend, dashboard

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(predict.router, prefix="/predict", tags=["predict"])
api_router.include_router(recommend.router, prefix="/recommend", tags=["recommend"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
