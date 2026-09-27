from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from .ingredient import RecipeIngredientResponse

class RecipeStepResponse(BaseModel):
    id: UUID
    step_number: int
    instruction: str
    
    class Config:
        from_attributes = True

class RecipeVariationBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    kcal: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbs: Optional[float] = None

class RecipeVariationResponse(RecipeVariationBase):
    id: UUID
    dish_id: UUID
    created_at: datetime
    recipe_ingredients: List[RecipeIngredientResponse] = []
    recipe_steps: List[RecipeStepResponse] = []

    class Config:
        from_attributes = True
