import sys, asyncio
sys.stdout.reconfigure(encoding="utf-8")
from app.database import AsyncSessionLocal
from app.services.shopping_service import compare_basket_deals

async def test():
    items = [
        {"name": "Brambory", "amount": 1, "unit": "kg"},
        {"name": "Máslo", "amount": 1, "unit": "ks"},
        {"name": "Cibule", "amount": 1, "unit": "kg"},
    ]
    async with AsyncSessionLocal() as session:
        # Plzeň Centrum: 49.7431, 13.3765 (Americká / Františkánská)
        res = await compare_basket_deals(db=session, items=items, user_lat=49.7431, user_lon=13.3765, city="Plzeň")
        print("STATUS:", res.get("status"))
        print("CLOSEST STORE IN PLZEŇ:", res["strategies"]["closest"]["stores"][0]["name"], res["strategies"]["closest"]["stores"][0]["address"], res["strategies"]["closest"]["stores"][0]["routeDistance"], "m")
        print("\nALL STORES IN PLZEŇ BY DISTANCE:")
        for s in res["all_stores"]:
            print(f"  • {s['chainName']:12} | {s['storeName']:35} | {s['address']:35} | {s['routeDistance']:4d} m ({s['walkingMinutes']} min) | {s['totalPrice']:5.1f} Kč")

asyncio.run(test())
