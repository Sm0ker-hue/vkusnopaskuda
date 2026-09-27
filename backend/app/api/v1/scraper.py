"""
scraper.py — API koncové body pro správu a monitoring autonomního plánovače cen.
"""
from fastapi import APIRouter, BackgroundTasks, Depends
from typing import Dict, Any

from app.services.scraper_scheduler import ScraperScheduler

router = APIRouter()


@router.get("/status", summary="Stav plánovače slev")
async def get_scheduler_status() -> Dict[str, Any]:
    """Vrátí aktuální status autonomního plánovače, časy běhů a statistiky."""
    scheduler = ScraperScheduler.get_instance()
    return scheduler.get_status()


@router.post("/sync", summary="Ruční spuštění synchronizace slev")
async def trigger_manual_sync(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """Spustí okamžitou asynchronní synchronizaci cen z Kupi.cz a AkcniCeny.cz na pozadí."""
    scheduler = ScraperScheduler.get_instance()
    if scheduler.status == "running":
        return {"status": "already_running", "message": "Synchronizace již právě probíhá."}

    background_tasks.add_task(scheduler.execute_full_sync, "Plzeň")
    return {
        "status": "triggered",
        "message": "Synchronizace cen pro Plzeň byla úspěšně spuštěna na pozadí.",
    }


@router.post("/start", summary="Nastartovat periodický plánovač")
async def start_scheduler() -> Dict[str, Any]:
    """Zapne automatický periodický plánovač slev."""
    scheduler = ScraperScheduler.get_instance()
    scheduler.start()
    return {"status": "started", "message": "Periodický plánovač byl nastartován."}


@router.post("/stop", summary="Zastavit periodický plánovač")
async def stop_scheduler() -> Dict[str, Any]:
    """Zastaví periodický plánovač slev."""
    scheduler = ScraperScheduler.get_instance()
    scheduler.stop()
    return {"status": "stopped", "message": "Periodický plánovač byl zastaven."}
