from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

def validate_czech_allergens(allergens: Optional[List[int]]) -> Optional[List[int]]:
    if allergens is None:
        return None
    for code in allergens:
        if not isinstance(code, int) or code < 1 or code > 14:
            raise ValueError(f"Neplatný kód alergenu: {code}. Oficiální české alergeny jsou pouze 1 až 14.")
    return sorted(list(set(allergens)))

class DietaryPreferences(BaseModel):
    is_vegan: bool = False
    is_vegetarian: bool = False
    is_keto: bool = False
    is_gluten_free: bool = False
    is_lactose_free: bool = False
    excluded_allergens: List[int] = Field(default_factory=list)
    city: str = "Plzeň"
    default_store: Optional[str] = None

    @field_validator("excluded_allergens")
    @classmethod
    def check_excluded_allergens(cls, v: List[int]) -> List[int]:
        return validate_czech_allergens(v) or []

class UserSettingsBase(BaseModel):
    preferences: DietaryPreferences = Field(default_factory=DietaryPreferences)
    allergies: List[int] = Field(default_factory=list)
    location_lat: Optional[float] = 49.7431
    location_lon: Optional[float] = 13.3765

    @field_validator("allergies")
    @classmethod
    def check_allergies(cls, v: List[int]) -> List[int]:
        return validate_czech_allergens(v) or []

class UserSettingsUpdate(BaseModel):
    preferences: Optional[Dict[str, Any]] = None
    allergies: Optional[List[int]] = None
    location_lat: Optional[float] = None
    location_lon: Optional[float] = None

    @field_validator("allergies")
    @classmethod
    def check_allergies_update(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        return validate_czech_allergens(v)

    @field_validator("preferences")
    @classmethod
    def check_preferences_update(cls, v: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if v and "excluded_allergens" in v and isinstance(v["excluded_allergens"], list):
            v["excluded_allergens"] = validate_czech_allergens(v["excluded_allergens"])
        return v

class UserSettingsResponse(BaseModel):
    user_id: UUID
    preferences: Dict[str, Any]
    allergies: List[int]
    location_lat: Optional[float]
    location_lon: Optional[float]
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserProfileResponse(UserResponse):
    settings: Optional[UserSettingsResponse] = None
