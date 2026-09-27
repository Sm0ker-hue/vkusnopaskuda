from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class DishBase(BaseModel):
    name: str

class DishCreate(DishBase):
    pass

class DishResponse(DishBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class DishSearchRequest(BaseModel):
    query: str
    preferences: Optional[Dict[str, Any]] = None
