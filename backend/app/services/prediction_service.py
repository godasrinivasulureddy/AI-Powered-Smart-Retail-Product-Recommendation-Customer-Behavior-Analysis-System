import joblib
import pandas as pd
from sqlalchemy.orm import Session

from app.db.models import ModelRegistry, CustomerFeature
from app.exceptions.base import NotFoundError, ConflictError


class PredictionService:
    """
    Loads the ACTIVE persisted model artifact and runs inference only.
    Never trains a model inside a request (spec rule).
    """

    def __init__(self, db: Session):
        self.db = db

    def _load_active_model(self):
        entry = (
            self.db.query(ModelRegistry)
            .filter(ModelRegistry.model_name == "purchase_prediction", ModelRegistry.is_active.is_(True))
            .first()
        )
        if not entry:
            raise ConflictError("No active purchase prediction model registered.", code="MODEL_NOT_READY")
        return entry, joblib.load(entry.artifact_path)

    def predict(
        self,
        customer_id: int | None = None,
        recency_days: int | None = None,
        frequency: int | None = None,
        monetary: float | None = None,
        avg_order_value: float | None = None,
    ) -> dict:
        if customer_id is not None and recency_days is None:
            features = self.db.get(CustomerFeature, customer_id)
            if not features:
                raise NotFoundError("No features available for this customer — cannot predict.", code="FEATURES_NOT_FOUND")
            recency = float(features.recency_days)
            freq = float(features.frequency)
            mon = float(features.monetary)
            aov = float(features.avg_order_value)
        else:
            recency = float(recency_days if recency_days is not None else 30)
            freq = float(frequency if frequency is not None else 5)
            mon = float(monetary if monetary is not None else 500.0)
            aov = float(avg_order_value if avg_order_value is not None else (mon / freq if freq > 0 else mon))

        entry, artifact = self._load_active_model()
        model, scaler, feature_names = artifact["model"], artifact["scaler"], artifact["features"]

        raw_dict = {
            "recency_days": recency,
            "frequency": freq,
            "monetary": mon,
            "avg_order_value": aov,
        }
        row = pd.DataFrame([[raw_dict[f] for f in feature_names]], columns=feature_names)
        X_scaled = scaler.transform(row)
        probability = float(model.predict_proba(X_scaled)[0, 1])

        return {
            "customer_id": customer_id,
            "probability": round(probability, 5),
            "prediction": probability >= 0.5,
            "model_version": entry.version,
        }

