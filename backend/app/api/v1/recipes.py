"""
recipes.py — API koncové body pro recepty, suroviny a kroky přípravy.
"""
from typing import Dict, Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.recipe_service import get_recipe_ingredients, get_recipe_details_service

router = APIRouter()


@router.get("/{id}/details")
async def get_recipe_details_route(
    id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Vrátí kompletní detail receptu včetně autentických surovin z českých
    supermarketů, poctivých kroků vaření a přesných nutričních hodnot (KBŽU).
    """
    details = await get_recipe_details_service(db, id)
    if not details:
        raise HTTPException(status_code=404, detail="Recept nebyl nalezen.")
    return details


@router.get("/{id}")
async def get_recipe_route(
    id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Alias pro /details — vrátí kompletní strukturu receptu."""
    details = await get_recipe_details_service(db, id)
    if not details:
        raise HTTPException(status_code=404, detail="Recept nebyl nalezen.")
    return details


@router.get("/{id}/ingredients")
async def get_recipe_ingredients_route(
    id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Vrátí seznam ingrediencí pro daný recept."""
    ingredients = await get_recipe_ingredients(db, id)
    return {"recipe_id": str(id), "ingredients": ingredients}


@router.get("/{id}/steps")
async def get_recipe_steps_route(
    id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Vrátí číslované kroky vaření pro daný recept."""
    details = await get_recipe_details_service(db, id)
    return {
        "recipe_id": str(id),
        "steps": details.get("steps", []) if details else [],
    }
