"""
shopping_service.py — Výpočet nejvýhodnějších nákupních strategií pro obchody.

Tento modul zajišťuje:
  1. Výpočet vzdálenosti uživatele k pobočkám (haversine vzorec).
  2. Inteligentní matching ingrediencí s produkty (RapidFuzz + normalizace).
  3. Tvorbu 3 strategií nákupu:
     - cheapest: nejlevnější nákupní košík
     - nearest: nejbližší prodejna (minimální dojezd/docházka)
     - optimal: vážený kompromis mezi cenou (60 %) a vzdáleností (40 %)
  4. Generování přímých navigačních odkazů (Google Maps & Apple Maps).
"""
import uuid
import math
import asyncio
import logging
from typing import Dict, Any, List, Optional, Tuple
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.models import ShoppingList, ShoppingListItem, Product, Store, StoreLocation, ProductIngredient, Ingredient
from app.services.kupi_service import extract_retail_search_term, search_kupi_links, parse_product_page_offers
from app.services.akcniceny_service import search_akcniceny_deals
from app.services.matcher_service import IntelligentMatcher

logger = logging.getLogger(__name__)


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Vypočítá vzdálenost ve vzdušné čáře mezi dvěma GPS souřadnicemi v kilometrech.
    Používá standardní sférický Haversinův vzorec s poloměrem Země R = 6371 km.
    """
    R = 6371.0  # Poloměr Země v km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(max(0.0, min(1.0, a))))


def generate_maps_deep_link(store_lat: float, store_lon: float, store_name: str) -> Dict[str, str]:
    """
    Vygeneruje přímé navigační odkazy pro Google Maps a Apple Maps.
    Používá direct routing (`dir/?api=1&destination=...`) pro okamžité spuštění navigace.
    """
    return {
        "google_maps_url": f"https://www.google.com/maps/dir/?api=1&destination={store_lat},{store_lon}",
        "google_maps_search": f"https://www.google.com/maps/search/?api=1&query={store_lat},{store_lon}",
        "apple_maps_url": f"http://maps.apple.com/?daddr={store_lat},{store_lon}&dirflg=d",
    }


async def find_best_deals(
    db: AsyncSession,
    shopping_list_id: uuid.UUID,
    user_lat: float,
    user_lon: float,
) -> Dict[str, Any]:
    """
    Najde nejlepší nabídky pro nákupní košík napříč českými řetězci.
    """
    # 1. Načtení položek nákupního košíku
    stmt = select(ShoppingListItem).where(ShoppingListItem.shopping_list_id == shopping_list_id)
    items = (await db.execute(stmt)).scalars().all()

    if not items:
        return {"shopping_list_id": str(shopping_list_id), "strategies": {}}

    item_map = {item.ingredient_id: item for item in items}
    ing_ids = list(item_map.keys())

    # 2. Hromadné načtení všech relevantních produktů pro tyto ingredience
    prod_stmt = (
        select(Product, ProductIngredient.ingredient_id)
        .join(ProductIngredient, Product.id == ProductIngredient.product_id)
        .where(ProductIngredient.ingredient_id.in_(ing_ids))
        .order_by(Product.discount_price.nulls_last(), Product.price)
    )
    prod_rows = (await db.execute(prod_stmt)).all()

    # Seskupení nejlepších produktů podle (store_id, ingredient_id)
    best_product_by_store: Dict[Tuple[uuid.UUID, uuid.UUID], Product] = {}
    for product, ingredient_id in prod_rows:
        key = (product.store_id, ingredient_id)
        if key not in best_product_by_store:
            best_product_by_store[key] = product

    # 3. Načtení všech obchodů a jejich poboček
    stores_stmt = select(Store).options(joinedload(Store.locations))
    all_stores = (await db.execute(stores_stmt)).unique().scalars().all()

    store_stats: List[Dict[str, Any]] = []

    # 4. Analýza každého řetězce
    for store in all_stores:
        if not store.locations:
            continue

        nearest_loc = min(
            store.locations,
            key=lambda loc: haversine(user_lat, user_lon, float(loc.lat), float(loc.lon)),
        )
        distance = haversine(user_lat, user_lon, float(nearest_loc.lat), float(nearest_loc.lon))

        total_price = 0.0
        covered_items_count = 0

        for ing_id, item in item_map.items():
            best_prod = best_product_by_store.get((store.id, ing_id))
            if best_prod:
                covered_items_count += 1
                price = float(best_prod.discount_price if best_prod.discount_price else best_prod.price)
                total_price += price * float(item.amount)

        if covered_items_count > 0:
            store_stats.append({
                "store_id": str(store.id),
                "store_name": store.name,
                "distance": round(distance, 2),
                "total_price": round(total_price, 2),
                "coverage": round(covered_items_count / len(items), 2),
                "location": {
                    "lat": float(nearest_loc.lat),
                    "lon": float(nearest_loc.lon),
                    "address": nearest_loc.address,
                    "city": nearest_loc.city,
                    "links": generate_maps_deep_link(
                        float(nearest_loc.lat), float(nearest_loc.lon), store.name
                    ),
                },
            })

    if not store_stats:
        return {"shopping_list_id": str(shopping_list_id), "strategies": {}}

    # 5. Výpočet strategií
    cheapest = min(store_stats, key=lambda x: (-x["coverage"], x["total_price"]))
    nearest = min(store_stats, key=lambda x: (-x["coverage"], x["distance"]))

    max_price = max((s["total_price"] for s in store_stats), default=1.0) or 1.0
    max_dist = max((s["distance"] for s in store_stats), default=1.0) or 1.0

    def optimal_score(s: Dict[str, Any]) -> float:
        norm_price = s["total_price"] / max_price
        norm_dist = s["distance"] / max_dist
        return 0.6 * norm_price + 0.4 * norm_dist

    optimal = min(store_stats, key=lambda x: (-x["coverage"], optimal_score(x)))

    return {
        "shopping_list_id": str(shopping_list_id),
        "strategies": {
            "cheapest": cheapest,
            "nearest": nearest,
            "optimal": optimal,
        },
    }


def calculate_retail_packages_needed(amount: float, unit: str) -> int:
    """Vypočítá reálný počet spotřebitelských balení suroviny v supermarketu."""
    u = (unit or "").lower().strip()
    if u in ["g", "ml"]:
        return max(1, math.ceil(amount / 1000.0) if amount > 1000 else 1)
    elif u in ["kg", "l", "ks", "balení", "kus"]:
        return max(1, math.ceil(float(amount)))
    return 1


async def compare_basket_deals(
    db: AsyncSession,
    items: List[Dict[str, Any]],
    user_lat: float = 49.7431,
    user_lon: float = 13.3765,
    city: Optional[str] = "Plzeň",
    excluded_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Kompletní porovnání nákupního košíku napříč českými supermarkety s reálnými cenami
    z Kupi.cz i AkcniCeny.cz s využitím IntelligentMatcher (RapidFuzz).
    """
    excluded_set = {n.strip().lower() for n in (excluded_names or []) if n}

    needed_items = []
    owned_items = []

    for idx, item in enumerate(items):
        item_name = item.get("name", "").strip()
        if not item_name:
            continue
        is_owned = any(ex in item_name.lower() or item_name.lower() in ex for ex in excluded_set)
        item_dict = {
            "id": item.get("id", f"ing-{idx}"),
            "name": item_name,
            "amount": float(item.get("amount", 1.0)),
            "unit": item.get("unit", "ks"),
            "category": item.get("category", "Recept"),
        }
        if is_owned:
            owned_items.append(item_dict)
        else:
            needed_items.append(item_dict)

    # 1. Načíst všechny obchody s jejich pobočkami
    stores_stmt = select(Store).options(joinedload(Store.locations))
    all_stores = (await db.execute(stores_stmt)).unique().scalars().all()

    # 2. Načíst všechny produkty z DB
    prod_stmt = select(Product, Store.name).join(Store, Product.store_id == Store.id)
    all_prods = (await db.execute(prod_stmt)).all()

    # 3. Vyhledání produktů pro každou chybějící položku přes IntelligentMatcher (RapidFuzz)
    item_matches: Dict[str, List[Tuple[Product, str, float]]] = {}
    for it in needed_items:
        clean_term = extract_retail_search_term(it["name"]).lower()

        scored_prods: List[Tuple[Product, str, float]] = []
        for p, s_name in all_prods:
            score = IntelligentMatcher.calculate_match_score(it["name"], p.name)
            if score >= 0.55:
                scored_prods.append((p, s_name, score))

        # Dynamické dotahování z Kupi.cz a AkcniCeny.cz při 0 výsledcích v DB
        if not scored_prods:
            try:
                store_map = {s.name.lower(): s for s in all_stores}
                # A. Kupi.cz dotaz
                links = await asyncio.to_thread(search_kupi_links, clean_term, 2)
                for l in links:
                    data = await asyncio.to_thread(parse_product_page_offers, l)
                    if data and data.get("offers"):
                        for off in data["offers"]:
                            st_name = off["store_name"]
                            st = store_map.get(st_name.lower())
                            if not st:
                                st = Store(name=st_name)
                                db.add(st)
                                await db.flush()
                                store_map[st_name.lower()] = st
                            new_prod = Product(
                                store_id=st.id,
                                name=data["product_name"],
                                price=off["price"],
                                discount_price=off["price"],
                                discount_valid_until=off["valid_until"],
                                url=data["url"],
                            )
                            db.add(new_prod)
                            await db.flush()
                            score = IntelligentMatcher.calculate_match_score(it["name"], new_prod.name)
                            scored_prods.append((new_prod, st_name, score))

                # B. AkcniCeny.cz dotaz
                if len(scored_prods) < 3:
                    akcni_offers = await asyncio.to_thread(search_akcniceny_deals, clean_term, 5)
                    for off in akcni_offers:
                        st_name = off["store_name"]
                        st = store_map.get(st_name.lower())
                        if not st:
                            st = Store(name=st_name)
                            db.add(st)
                            await db.flush()
                            store_map[st_name.lower()] = st
                        new_prod = Product(
                            store_id=st.id,
                            name=off["name"],
                            price=off["price"],
                            discount_price=off["discount_price"],
                            discount_valid_until=off.get("valid_until"),
                            url=off.get("url"),
                        )
                        db.add(new_prod)
                        await db.flush()
                        score = IntelligentMatcher.calculate_match_score(it["name"], new_prod.name)
                        scored_prods.append((new_prod, st_name, score))

                if scored_prods:
                    await db.commit()
            except Exception as err:
                logger.warning("Chyba při on-demand dotahování pro '%s': %s", clean_term, err)

        # Seřadit podle skóre shody
        scored_prods.sort(key=lambda x: x[2], reverse=True)
        item_matches[it["id"]] = scored_prods

    # Výpočet průměrných tržních cen pro jednotlivé suroviny
    market_avg_prices: Dict[str, float] = {}
    for it in (needed_items + owned_items):
        matches = [
            float(p.discount_price if p.discount_price else p.price)
            for p, _ in all_prods
            if IntelligentMatcher.calculate_match_score(it["name"], p.name) >= 0.55
        ]
        market_avg_prices[it["id"]] = sum(matches) / len(matches) if matches else 34.90

    # Výpočet úspory za položky doma
    saved_money = sum(
        market_avg_prices.get(it["id"], 34.90) * calculate_retail_packages_needed(it["amount"], it["unit"])
        for it in owned_items
    )

    # 4. Vyhodnocení košíku pro každý řetězec
    evaluated_stores: List[Dict[str, Any]] = []

    for store in all_stores:
        if not store.locations:
            continue

        city_lower = (city or "").lower()
        clean_city = city_lower.split(",")[0].split("(")[0].strip()

        is_plzen_coord = (49.4 <= user_lat <= 50.1) and (13.0 <= user_lon <= 13.8)
        is_plzen = "plz" in clean_city or "plz" in city_lower or is_plzen_coord or (not clean_city or clean_city == "gps")

        if is_plzen:
            city_locs = [l for l in store.locations if "plz" in (l.city or "").lower()]
            candidate_locs = city_locs if city_locs else store.locations
        elif clean_city:
            city_locs = [
                l for l in store.locations
                if clean_city in (l.city or "").lower() or (l.city or "").lower() in clean_city
            ]
            candidate_locs = city_locs if city_locs else store.locations
        else:
            candidate_locs = store.locations

        nearest_loc = min(
            candidate_locs,
            key=lambda loc: haversine(user_lat, user_lon, float(loc.lat), float(loc.lon)),
        )

        distance_km = haversine(user_lat, user_lon, float(nearest_loc.lat), float(nearest_loc.lon))
        distance_m = int(round(distance_km * 1000))
        route_dist_m = int(round(distance_m * 1.35))
        walking_mins = max(1, int(round(route_dist_m / 75)))

        store_total_price = 0.0
        store_items = []
        covered_count = 0

        for it in needed_items:
            packages = calculate_retail_packages_needed(it["amount"], it["unit"])
            matches = item_matches.get(it["id"], [])
            # Hledáme produkty v tomto konkrétním obchodě
            store_prods = [p for p, s_name, _ in matches if s_name.lower() == store.name.lower()]

            if store_prods:
                best_prod = min(store_prods, key=lambda p: float(p.discount_price if p.discount_price else p.price))
                item_unit_price = float(best_prod.discount_price if best_prod.discount_price else best_prod.price)
                item_total = item_unit_price * packages
                covered_count += 1
                store_items.append({
                    "product": {
                        "id": str(best_prod.id),
                        "ingredientId": it["id"],
                        "storeId": f"st-{store.name.lower().replace(' ', '-')}",
                        "name": best_prod.name,
                        "price": round(item_total, 2),
                        "unitPrice": round(item_unit_price, 2),
                        "quantity": packages,
                        "unit": "balení" if it["unit"] in ["g", "ml"] else it["unit"],
                        "discountValidUntil": (
                            best_prod.discount_valid_until.strftime("%d.%m.%Y")
                            if best_prod.discount_valid_until
                            else None
                        ),
                        "isRealDeal": True,
                    },
                    "ingredient": it,
                })
                store_total_price += item_total
            else:
                avg_unit_price = market_avg_prices.get(it["id"], 34.90)
                item_total = avg_unit_price * packages
                store_items.append({
                    "product": {
                        "id": f"est-{store.name}-{it['id']}",
                        "ingredientId": it["id"],
                        "storeId": f"st-{store.name.lower().replace(' ', '-')}",
                        "name": f"{it['name']} ({store.name})",
                        "price": round(item_total, 2),
                        "unitPrice": round(avg_unit_price, 2),
                        "quantity": packages,
                        "unit": "balení" if it["unit"] in ["g", "ml"] else it["unit"],
                        "discountValidUntil": None,
                        "isRealDeal": False,
                    },
                    "ingredient": it,
                })
                store_total_price += item_total

        coverage = round(covered_count / len(needed_items), 2) if needed_items else 1.0

        evaluated_stores.append({
            "storeId": f"st-{store.name.lower().replace(' ', '-')}",
            "storeName": f"{store.name} ({nearest_loc.address.split(',')[0]})",
            "chainName": store.name,
            "address": f"{nearest_loc.address}, {nearest_loc.city}",
            "distance": distance_m,
            "routeDistance": route_dist_m,
            "walkingMinutes": walking_mins,
            "lat": float(nearest_loc.lat),
            "lng": float(nearest_loc.lon),
            "totalPrice": round(store_total_price, 2),
            "coverage": coverage,
            "items": store_items,
            "navigation": generate_maps_deep_link(
                float(nearest_loc.lat), float(nearest_loc.lon), store.name
            ),
        })

    if not evaluated_stores:
        return {
            "strategies": {},
            "all_stores": [],
            "owned_items": owned_items,
            "saved_money": round(saved_money, 2),
        }

    closest_store = min(evaluated_stores, key=lambda s: s["routeDistance"])
    cheapest_store = min(evaluated_stores, key=lambda s: s["totalPrice"])

    max_price = max((s["totalPrice"] for s in evaluated_stores), default=1.0) or 1.0
    max_dist = max((s["routeDistance"] for s in evaluated_stores), default=1.0) or 1.0

    def optimal_score(s: Dict[str, Any]) -> float:
        norm_price = s["totalPrice"] / max_price
        norm_dist = s["routeDistance"] / max_dist
        return 0.6 * norm_price + 0.4 * norm_dist

    optimal_store = min(evaluated_stores, key=optimal_score)

    def format_strategy(strat_type: str, store_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "type": strat_type,
            "totalPrice": store_data["totalPrice"],
            "stores": [{
                "id": store_data["storeId"],
                "name": store_data["storeName"],
                "address": store_data["address"],
                "distance": store_data["distance"],
                "routeDistance": store_data["routeDistance"],
                "walkingMinutes": store_data["walkingMinutes"],
                "lat": store_data["lat"],
                "lng": store_data["lng"],
            }],
            "items": store_data["items"],
        }

    sorted_all_stores = sorted(evaluated_stores, key=lambda s: s["routeDistance"])

    return {
        "status": "success",
        "strategies": {
            "cheapest": format_strategy("cheapest", cheapest_store),
            "closest": format_strategy("closest", closest_store),
            "optimal": format_strategy("optimal", optimal_store),
        },
        "all_stores": sorted_all_stores,
        "owned_items": owned_items,
        "saved_money": round(saved_money, 2),
    }
