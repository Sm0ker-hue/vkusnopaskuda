"""
ratings.py — API koncové body pro hodnocení receptů a historii vaření.
"""
from typing import Optional, List, Dict, Any
from uuid import UUID
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Rating, CookingHistory, User

router = APIRouter()

GUEST_USER_EMAIL = "guest@vkusnopaskuda.cz"


async def get_or_create_guest_user(db: AsyncSession) -> User:
    """Zajistí existenci výchozího hostovského účtu pro anonymní hodnocení."""
    stmt = select(User).where(User.email == GUEST_USER_EMAIL)
    user = (await db.execute(stmt)).scalars().first()
    if not user:
        user = User(
            id=uuid.uuid4(),
            email=GUEST_USER_EMAIL,
            password_hash="guest_no_auth",
            name="Host",
        )
        db.add(user)
        await db.flush()
    return user


class RatingCreate(BaseModel):
    """Schéma pro odeslání hodnocení receptu uživatelem."""
    user_id: Optional[UUID] = None
    score: int
    comment: Optional[str] = None


class CookingHistoryCreate(BaseModel):
    """Schéma pro zaznamenání dokončení vaření receptu."""
    user_id: Optional[UUID] = None
    recipe_id: UUID


@router.post("/{recipe_id}/rate")
async def rate_recipe(
    recipe_id: UUID,
    rating: RatingCreate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """
    Uloží nebo aktualizuje hodnocení receptu od uživatele (1–5 hvězdiček).
    Pokud user_id chybí, použije se výchozí hostovský účet.
    """
    effective_user_id = rating.user_id
    if not effective_user_id:
        guest_user = await get_or_create_guest_user(db)
        effective_user_id = guest_user.id

    # Kontrola existence předchozího hodnocení (upsert)
    stmt = select(Rating).where(
        Rating.user_id == effective_user_id,
        Rating.recipe_id == recipe_id,
    )
    existing = (await db.execute(stmt)).scalars().first()

    if existing:
        existing.score = rating.score
        existing.comment = rating.comment
    else:
        new_rating = Rating(
            user_id=effective_user_id,
            recipe_id=recipe_id,
            score=rating.score,
            comment=rating.comment,
        )
        db.add(new_rating)

    await db.commit()
    return {"message": "Hodnocení bylo úspěšně uloženo."}


@router.get("/{recipe_id}/ratings")
async def get_ratings(
    recipe_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Vrátí všechna hodnocení pro daný recept."""
    stmt = select(Rating).where(Rating.recipe_id == recipe_id)
    result = await db.execute(stmt)
    ratings = result.scalars().all()
    return [
        {"user_id": str(r.user_id), "score": r.score, "comment": r.comment}
        for r in ratings
    ]


@router.post("/history")
async def log_cooking_history(
    entry: CookingHistoryCreate,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, str]:
    """Zaznamená uvařené jídlo do historie uživatele."""
    effective_user_id = entry.user_id
    if not effective_user_id:
        guest_user = await get_or_create_guest_user(db)
        effective_user_id = guest_user.id

    history_record = CookingHistory(
        user_id=effective_user_id,
        recipe_id=entry.recipe_id,
    )
    db.add(history_record)
    await db.commit()
    return {"message": "Záznam byl uložen do historie vaření."}
