from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class ShoppingStrategy(str, Enum):
    CHEAPEST = 'cheapest'
    NEAREST = 'nearest'
    OPTIMAL = 'optimal'

class ShoppingListItemResponse(BaseModel):
    id: UUID
    ingredient_id: UUID
    product_id: Optional[UUID] = None
    amount: float
    unit: str
    is_bought: bool

    class Config:
        from_attributes = True

class ShoppingListResponse(BaseModel):
    id: UUID
    user_id: UUID
    recipe_id: Optional[UUID] = None
    status: str
    strategy: ShoppingStrategy
    items: List[ShoppingListItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
