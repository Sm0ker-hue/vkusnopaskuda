"""
users.py — API koncové body pro profil uživatele a správu dietních preferencí a alergií.
"""
import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserSettings
from app.schemas.user import UserSettingsUpdate, UserSettingsResponse, UserProfileResponse

router = APIRouter()

DEMO_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def get_or_create_user(
    db: AsyncSession,
    user_id_str: Optional[str] = None,
) -> User:
    """Získá uživatele podle UUID nebo vytvoří výchozího/anonymního uživatele."""
    target_id = DEMO_USER_ID
    if user_id_str:
        try:
            target_id = uuid.UUID(user_id_str)
        except ValueError:
            pass

    stmt = select(User).where(User.id == target_id)
    user = (await db.execute(stmt)).scalars().first()

    if not user:
        user = User(
            id=target_id,
            email=f"guest_{str(target_id)[:8]}@vkusno.cz",
            password_hash="mock_hash",
            name="Kuchař Gurmán",
        )
        db.add(user)
        await db.flush()

        settings = UserSettings(
            user_id=user.id,
            preferences={
                "is_vegan": False,
                "is_vegetarian": False,
                "is_keto": False,
                "is_gluten_free": False,
                "is_lactose_free": False,
                "city": "Plzeň",
                "default_store": "Lidl",
            },
            allergies=[],
            location_lat=49.7431,
            location_lon=13.3765,
        )
        db.add(settings)
        await db.commit()
        await db.refresh(user)

    return user


@router.get("/me", summary="Získat profil a nastavení uživatele")
async def get_my_profile(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Vrátí profil uživatele, jeho dietní omezení a oblíbené supermarkety."""
    user = await get_or_create_user(db, x_user_id)
    settings_stmt = select(UserSettings).where(UserSettings.user_id == user.id)
    settings = (await db.execute(settings_stmt)).scalars().first()

    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "settings": {
            "user_id": str(settings.user_id) if settings else str(user.id),
            "preferences": settings.preferences if settings else {},
            "allergies": settings.allergies if settings else [],
            "location_lat": settings.location_lat if settings else 49.7431,
            "location_lon": settings.location_lon if settings else 13.3765,
        },
    }


@router.get("/me/settings", summary="Získat pouze nastavení a filtry")
async def get_my_settings(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Vrátí uložená dietní omezení, alergeny a preferované město."""
    user = await get_or_create_user(db, x_user_id)
    stmt = select(UserSettings).where(UserSettings.user_id == user.id)
    settings = (await db.execute(stmt)).scalars().first()

    if not settings:
        return {
            "preferences": {
                "is_vegan": False,
                "is_vegetarian": False,
                "is_keto": False,
                "is_gluten_free": False,
                "is_lactose_free": False,
                "city": "Plzeň",
            },
            "allergies": [],
            "location_lat": 49.7431,
            "location_lon": 13.3765,
        }

    return {
        "user_id": str(settings.user_id),
        "preferences": settings.preferences,
        "allergies": settings.allergies,
        "location_lat": settings.location_lat,
        "location_lon": settings.location_lon,
    }


@router.put("/me/settings", summary="Aktualizovat dietní preference a alergeny")
async def update_my_settings(
    update_data: UserSettingsUpdate,
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Uloží změněné dietní filtry (vegan, keto, bez lepku/laktózy, alergeny 1-14) do DB."""
    user = await get_or_create_user(db, x_user_id)
    stmt = select(UserSettings).where(UserSettings.user_id == user.id)
    settings = (await db.execute(stmt)).scalars().first()

    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)

    if update_data.preferences is not None:
        merged_prefs = dict(settings.preferences or {})
        merged_prefs.update(update_data.preferences)
        settings.preferences = merged_prefs

    if update_data.allergies is not None:
        settings.allergies = update_data.allergies

    if update_data.location_lat is not None:
        settings.location_lat = update_data.location_lat

    if update_data.location_lon is not None:
        settings.location_lon = update_data.location_lon

    await db.commit()
    await db.refresh(settings)

    return {
        "status": "success",
        "message": "Nastavení a dietní preference byly úspěšně uloženy do PostgreSQL.",
        "settings": {
            "user_id": str(settings.user_id),
            "preferences": settings.preferences,
            "allergies": settings.allergies,
            "location_lat": settings.location_lat,
            "location_lon": settings.location_lon,
        },
    }
