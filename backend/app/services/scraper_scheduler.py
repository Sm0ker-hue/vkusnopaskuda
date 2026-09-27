"""
scraper_scheduler.py — Autonomní plánovač a orchestrátor aktualizace cen a slev.

Pravidelně (výchozí interval 6 hodin) i na vyžádání:
  1. Stahuje akční nabídky z Kupi.cz i AkcniCeny.cz pro prodejny v Plzni a ČR.
  2. Ukládá nové a aktualizuje existující ceny v PostgreSQL databázi.
  3. Pomocí IntelligentMatcher (RapidFuzz) přesně páruje produkty s ingrediencemi.
  4. Uchovává telemetrii, historii běhů a statistiky pro monitoring a API.
"""
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import AsyncSessionLocal
from app.models.store import Store, StoreLocation
from app.models.product import Product, ProductIngredient
from app.models.ingredient import Ingredient
from app.services.kupi_service import sync_all_staple_deals, ESSENTIAL_STAPLES_QUERIES
from app.services.akcniceny_service import search_akcniceny_deals
from app.services.matcher_service import IntelligentMatcher

logger = logging.getLogger(__name__)

# Základní interval běhu v sekundách (výchozí 6 hodin = 21600 s)
DEFAULT_INTERVAL_SECONDS = 6 * 3600


class ScraperScheduler:
    """Singleton orchestrátor plánovače stahování slev a katalogů."""

    _instance: Optional["ScraperScheduler"] = None

    def __init__(self, interval_seconds: int = DEFAULT_INTERVAL_SECONDS):
        self.interval_seconds = interval_seconds
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        self.status: str = "idle"  # "idle", "running", "completed", "error"
        self.last_run_time: Optional[datetime] = None
        self.next_run_time: Optional[datetime] = None
        self.total_runs: int = 0
        self.total_items_scraped: int = 0
        self.last_error: Optional[str] = None
        self.history: List[Dict[str, Any]] = []
        self._sync_lock = asyncio.Lock()

    @classmethod
    def get_instance(cls) -> "ScraperScheduler":
        if cls._instance is None:
            cls._instance = ScraperScheduler()
        return cls._instance

    def get_status(self) -> Dict[str, Any]:
        """Vrátí aktuální stav plánovače pro API a monitoring."""
        return {
            "status": self.status,
            "is_background_task_active": self.is_running and (self._task is not None and not self._task.done()),
            "interval_hours": round(self.interval_seconds / 3600, 1),
            "last_run_time": self.last_run_time.isoformat() if self.last_run_time else None,
            "next_run_time": self.next_run_time.isoformat() if self.next_run_time else None,
            "total_runs": self.total_runs,
            "total_items_scraped": self.total_items_scraped,
            "last_error": self.last_error,
            "history": self.history[-10:],
        }

    async def execute_full_sync(self, city: str = "Plzeň") -> Dict[str, Any]:
        """
        Provede kompletní synchronizační cyklus:
        - Načte nabídky z Kupi.cz i AkcniCeny.cz
        - Uloží/aktualizuje produkty a provede fuzzy matching
        """
        if self._sync_lock.locked():
            return {
                "timestamp": datetime.now().isoformat(),
                "status": "already_running",
                "message": "Synchronizace již právě probíhá.",
            }

        async with self._sync_lock:
            start_time = datetime.now()
            self.status = "running"
            self.last_run_time = start_time
            logger.info("Spouštím autonomní synchronizaci slev pro město %s...", city)

            items_saved = 0
            sources_summary = {"kupi": 0, "akcniceny": 0}

            try:
                async with AsyncSessionLocal() as session:
                    # 1. Kupi.cz synchronizace
                    try:
                        kupi_res = await sync_all_staple_deals(session)
                        kupi_saved = kupi_res.get("total_offers_saved", 0)
                        sources_summary["kupi"] = kupi_saved
                        items_saved += kupi_saved
                    except Exception as e:
                        logger.error("Chyba při Kupi.cz synchronizaci v plánovači: %s", e)

                    # 2. AkcniCeny.cz synchronizace
                    try:
                        akcni_saved = await self._sync_akcniceny_staples(session)
                        sources_summary["akcniceny"] = akcni_saved
                        items_saved += akcni_saved
                    except Exception as e:
                        logger.error("Chyba při AkcniCeny.cz synchronizaci v plánovači: %s", e)

                duration = (datetime.now() - start_time).total_seconds()
                self.status = "idle"
                self.total_runs += 1
                self.total_items_scraped += items_saved
                self.next_run_time = datetime.now() + timedelta(seconds=self.interval_seconds)

                record = {
                    "timestamp": start_time.isoformat(),
                    "duration_seconds": round(duration, 2),
                    "items_saved": items_saved,
                    "sources": sources_summary,
                    "status": "success",
                }
                self.history.append(record)
                logger.info("Synchronizace dokončena za %.2fs. Uloženo celkem %d položek.", duration, items_saved)
                return record

            except Exception as e:
                self.status = "error"
                self.last_error = str(e)
                logger.error("Kritická chyba plánovače: %s", e)
                record = {
                    "timestamp": start_time.isoformat(),
                    "status": "error",
                    "error": str(e),
                }
                self.history.append(record)
                return record

    async def _sync_akcniceny_staples(self, session: AsyncSession) -> int:
        """Stáhne a uloží akce z AkcniCeny.cz pro klíčové suroviny."""
        total_saved = 0
        stores_stmt = select(Store)
        stores = (await session.execute(stores_stmt)).scalars().all()
        store_map = {s.name.lower(): s for s in stores}

        all_ings = (await session.execute(select(Ingredient))).scalars().all()
        seen_links = set()

        # Omezíme na reprezentativní vzorek klíčových potravin
        queries_to_run = ["máslo", "brambory", "mléko", "kuře", "vejce", "sýr", "mouka", "cibule"]

        for q in queries_to_run:
            offers = await asyncio.to_thread(search_akcniceny_deals, q, 6)
            if not offers:
                continue

            for off in offers:
                store_name = off["store_name"]
                store = store_map.get(store_name.lower())
                if not store:
                    store = Store(name=store_name)
                    session.add(store)
                    await session.flush()
                    store_map[store_name.lower()] = store

                prod_stmt = select(Product).where(
                    Product.store_id == store.id,
                    Product.name == off["name"],
                )
                existing_prod = (await session.execute(prod_stmt)).scalars().first()

                if existing_prod:
                    existing_prod.price = off["price"]
                    existing_prod.discount_price = off["discount_price"]
                    if off.get("valid_until"):
                        existing_prod.discount_valid_until = off["valid_until"]
                    target_prod = existing_prod
                else:
                    target_prod = Product(
                        store_id=store.id,
                        name=off["name"],
                        price=off["price"],
                        discount_price=off["discount_price"],
                        discount_valid_until=off.get("valid_until"),
                        url=off.get("url"),
                    )
                    session.add(target_prod)
                    await session.flush()

                # Najít odpovídající ingredience a propojit přes IntelligentMatcher
                for ing in all_ings:
                    pair_key = (target_prod.id, ing.id)
                    if pair_key in seen_links:
                        continue
                    score = IntelligentMatcher.calculate_match_score(ing.name, target_prod.name)
                    if score >= 0.70:
                        seen_links.add(pair_key)
                        link_stmt = select(ProductIngredient).where(
                            ProductIngredient.product_id == target_prod.id,
                            ProductIngredient.ingredient_id == ing.id,
                        )
                        existing_link = (await session.execute(link_stmt)).scalars().first()
                        if not existing_link:
                            session.add(
                                ProductIngredient(
                                    product_id=target_prod.id,
                                    ingredient_id=ing.id,
                                    match_score=score,
                                )
                            )
                            await session.flush()
                        else:
                            existing_link.match_score = score

                total_saved += 1

            await session.commit()

        return total_saved

    async def _background_loop(self):
        """Asynchronní smyčka spouštěná periodicky na pozadí."""
        logger.info("Pozadní smyčka ScraperScheduler spuštěna (interval: %ds).", self.interval_seconds)
        while self.is_running:
            try:
                await self.execute_full_sync()
            except Exception as e:
                logger.error("Výjimka v periodické smyčce plánovače: %s", e)

            # Čekání na další interval
            try:
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
        logger.info("Pozadní smyčka ScraperScheduler ukončena.")

    def start(self):
        """Spustí plánovač na pozadí."""
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._background_loop())
            self.next_run_time = datetime.now() + timedelta(seconds=self.interval_seconds)
            logger.info("Plánovač slev byl úspěšně nastartován.")

    def stop(self):
        """Zastaví plánovač."""
        self.is_running = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("Plánovač slev byl zastaven.")
