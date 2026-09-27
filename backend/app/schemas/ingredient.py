from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class IngredientBase(BaseModel):
    name: str
    kcal_per_100g: Optional[float] = None
    protein_per_100g: Optional[float] = None
    fat_per_100g: Optional[float] = None
    carbs_per_100g: Optional[float] = None

class IngredientResponse(IngredientBase):
    id: UUID

    class Config:
        from_attributes = True

class RecipeIngredientResponse(BaseModel):
    id: UUID
    ingredient: IngredientResponse
    amount: float
    unit: str

    class Config:
        from_attributes = True

class IngredientChecklistItem(BaseModel):
    ingredient_id: UUID
    name: str
    is_available_in_inventory: bool
