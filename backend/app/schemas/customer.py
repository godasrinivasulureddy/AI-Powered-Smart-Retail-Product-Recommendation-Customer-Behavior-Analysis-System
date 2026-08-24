from datetime import date, datetime
from pydantic import BaseModel, ConfigDict


class CustomerFeaturesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    customer_id: int
    recency_days: int
    frequency: int
    monetary: float
    avg_order_value: float
    last_computed_at: datetime


class CustomerSegmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    customer_id: int
    model_version: str
    segment_label: str
    computed_at: datetime


class CustomerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    external_id: str
    country: str | None
    first_purchase_date: date | None
    features: CustomerFeaturesOut | None = None
    segment: CustomerSegmentOut | None = None


class PredictPurchaseRequest(BaseModel):
    customer_id: int | None = None
    recency_days: int | None = None
    frequency: int | None = None
    monetary: float | None = None
    avg_order_value: float | None = None


class PredictPurchaseResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    customer_id: int | None = None
    probability: float
    prediction: bool
    model_version: str



class RecommendRequest(BaseModel):
    customer_id: int
    top_n: int = 5


class RecommendationItem(BaseModel):
    product_id: int
    external_id: str
    description: str | None
    score: float
    reason: str
    unit_price: float | None = None


class RecommendResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    customer_id: int
    model_version: str
    recommendations: list[RecommendationItem]


