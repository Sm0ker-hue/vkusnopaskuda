from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Store

CZECH_STORES = [
    {"name": "Albert"},
    {"name": "Tesco"},
    {"name": "Lidl"},
    {"name": "Kaufland"},
    {"name": "Billa"},
    {"name": "Penny Market"},
    {"name": "Globus"},
    {"name": "Makro"},
    {"name": "Coop"},
    {"name": "Norma"},
    {"name": "Rohlík"},
    {"name": "Košík"}
]

async def seed_stores(db: AsyncSession):
    """Seed 12 Czech supermarkets if they don't exist in the database."""
    for store_data in CZECH_STORES:
        stmt = select(Store).where(Store.name == store_data["name"])
        existing = (await db.execute(stmt)).scalars().first()
        if not existing:
            new_store = Store(name=store_data["name"])
            db.add(new_store)
    
    await db.commit()
