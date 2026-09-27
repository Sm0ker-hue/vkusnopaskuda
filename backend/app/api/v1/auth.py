import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User, UserSettings
from app.schemas.user import UserCreate, UserResponse

router = APIRouter()


@router.post("/register", summary="Registrace nového uživatele")
async def register_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.email == user_in.email.lower().strip())
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        return {"message": "Uživatel již existuje", "user_id": str(existing.id), "email": existing.email}

    new_user = User(
        email=user_in.email.lower().strip(),
        password_hash="hashed_pw_placeholder",
        name=user_in.name or user_in.email.split("@")[0],
    )
    db.add(new_user)
    await db.flush()

    settings = UserSettings(
        user_id=new_user.id,
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
    await db.refresh(new_user)

    return {
        "message": "Uživatel byl úspěšně zaregistrován",
        "user_id": str(new_user.id),
        "email": new_user.email,
        "name": new_user.name,
    }


@router.post("/login", summary="Přihlášení uživatele")
async def login_user():
    return {
        "access_token": "vkusno_session_token_authenticated",
        "token_type": "bearer",
        "user_id": "00000000-0000-0000-0000-000000000001",
    }
