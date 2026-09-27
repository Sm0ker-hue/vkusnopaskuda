"""
dishes.py — API koncové body pro vyhledávání jídel a získávání jejich variant.
"""
from typing import List, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.recipe import RecipeVariation
from app.schemas.dish import DishSearchRequest
from app.services.recipe_service import search_dish

router = APIRouter()


@router.post("/search")
async def search_dish_route(
    request: DishSearchRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Vyhledá zadané jídlo nebo pro něj vygeneruje 3–4 lákavé varianty.
    Podporuje dietní filtry (vegan, vegetarián, bez lepku, bez laktózy)
    a oficiální české alergeny 1–14.
    """
    result = await search_dish(db, request.query, preferences=request.preferences)
    return result


@router.get("/{dish_id}/variations")
async def get_dish_variations(
    dish_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Vrátí všechny vygenerované varianty receptu pro dané jídlo,
    včetně nutričních hodnot (kalorie, bílkoviny, tuky, sacharidy).
    """
    stmt = select(RecipeVariation).where(RecipeVariation.dish_id == dish_id)
    variations = (await db.execute(stmt)).scalars().all()

    if not variations:
        raise HTTPException(status_code=404, detail="Pro toto jídlo nebyly nalezeny žádné varianty.")

    return [
        {
            "id": str(v.id),
            "dish_id": str(v.dish_id),
            "name": v.name,
            "description": v.description,
            "prep_time_minutes": v.prep_time_minutes,
            "cook_time_minutes": v.cook_time_minutes,
            "kcal": float(v.kcal) if v.kcal else None,
            "protein": float(v.protein) if v.protein else None,
            "fat": float(v.fat) if v.fat else None,
            "carbs": float(v.carbs) if v.carbs else None,
            "image_url": v.image_url,
        }
        for v in variations
    ]
