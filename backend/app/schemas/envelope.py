from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    data: Optional[T] = None
    error: Optional[dict] = None
