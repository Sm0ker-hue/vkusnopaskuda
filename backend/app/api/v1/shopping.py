"""
shopping.py — API koncové body pro správu nákupního košíku a hledání akčních nabídek.
"""
from typing import List, Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.recipe_service import create_shopping_list
from app.services.shopping_service import find_best_deals, compare_basket_deals

router = APIRouter()


class CartCreateRequest(BaseModel):
    """Požadavek na vytvoření nákupního košíku s vyloučením domácích zásob."""
    recipe_id: UUID
    user_id: UUID
    # Podporuje UUID i string identifikátory surovin pro maximální kompatibilitu
    owned_ingredients: List[Any] = []


@router.post("/cart")
async def create_cart_route(
    request: CartCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Vytvoří nákupní košík z receptu a do seznamu nákupu zařadí POUZE suroviny,
    které uživatel označil, že doma NEMÁ.
    """
    result = await create_shopping_list(
        db,
        request.recipe_id,
        request.user_id,
        request.owned_ingredients,
    )
    return result


@router.get("/cart/{id}/deals")
async def get_cart_deals_route(
    id: UUID,
    lat: float = 0.0,
    lon: float = 0.0,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Vypočítá nejvýhodnější nákupní nabídky v okolí uživatele (nejlevnější,
    nejbližší, optimální kompromis) a vrátí navigační linky pro Google/Apple Maps.
    """
    result = await find_best_deals(db, id, lat, lon)
    return result


class CompareItem(BaseModel):
    id: Optional[str] = None
    name: str
    amount: Optional[float] = 1.0
    unit: Optional[str] = "ks"
    category: Optional[str] = "Recept"


class CompareBasketRequest(BaseModel):
    items: List[CompareItem]
    user_lat: Optional[float] = 49.7431
    user_lon: Optional[float] = 13.3765
    city: Optional[str] = "Plzeň"
    excluded_names: Optional[List[str]] = []


@router.post("/compare")
async def compare_basket_route(
    request: CompareBasketRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Kompletní porovnání nákupního košíku s reálnými cenami z českých supermarketů a Kupi.cz.
    Vrátí 3 strategie (nejlevnější, nejbližší, optimální), přesné GPS koordináty,
    vzdálenost v metrech a reálné akční ceny s datem platnosti.
    """
    items_dicts = [item.model_dump() for item in request.items]
    return await compare_basket_deals(
        db=db,
        items=items_dicts,
        user_lat=request.user_lat or 49.7431,
        user_lon=request.user_lon or 13.3765,
        city=request.city or "Plzeň",
        excluded_names=request.excluded_names or [],
    )

