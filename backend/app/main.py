"""
main.py — Vstupní bod FastAPI aplikace 'ВкусноПаскуда!' (FoodTech PWA).
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.database import engine
from app.services.scraper_scheduler import ScraperScheduler

# Nastavení strukturovaného logování
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("vkusno_backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Správa životního cyklu aplikace (start a uvolnění DB poolu při vypnutí)."""
    logger.info("Spouštím backend 'ВкусноПаскуда!' (verze %s)...", settings.VERSION)
    scheduler = ScraperScheduler.get_instance()
    scheduler.start()
    yield
    logger.info("Ukončuji backend, zastavuji plánovač a uvolňuji databázová spojení...")
    scheduler.stop()
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Povolení CORS pro lokální vývoj i produkční deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrace hlavního routeru s verzovaným prefixem /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/healthz", tags=["system"])
async def health_check():
    """Zdravotní test pro monitoring a deployment kontrolu."""
    return {"status": "ok", "project": settings.PROJECT_NAME, "version": settings.VERSION}
