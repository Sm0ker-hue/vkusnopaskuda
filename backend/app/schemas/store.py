from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class StoreLocationResponse(BaseModel):
    id: UUID
    address: str
    city: str
    lat: float
    lon: float

    class Config:
        from_attributes = True

class StoreResponse(BaseModel):
    id: UUID
    name: str
    locations: List[StoreLocationResponse] = []

    class Config:
        from_attributes = True
