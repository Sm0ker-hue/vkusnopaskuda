"""
database.py — Konfigurace asynchronního připojení k PostgreSQL (Neon).
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.config import settings

# Asynchronní engine s automatickým reconnectem (pool_pre_ping=True)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True,
)

# Továrna na asynchronní databázové relace
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Základní deklarativní třída pro modely
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI závislost (Depends) pro bezpečné získání a automatické uzavření DB relace.
    """
    async with AsyncSessionLocal() as session:
        yield session
