"""
akcniceny_service.py — Služba pro získávání akčních cen z AkcniCeny.cz.

Podporuje vyhledávání českých supermarketů:
Albert, Billa, Lidl, Kaufland, Tesco, Penny Market, Globus, Coop, Norma.
Data jsou normalizována a propojena se surovinami přes IntelligentMatcher.
"""
import re
import urllib.request
import urllib.parse
import logging
from typing import Dict, Any, List, Optional, Set, Tuple
from datetime import datetime

from bs4 import BeautifulSoup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.store import Store
from app.models.product import Product, ProductIngredient
from app.models.ingredient import Ingredient
from app.services.kupi_service import normalize_store_name, extract_retail_search_term
from app.services.matcher_service import IntelligentMatcher

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
}

BASE_URL = "https://www.akcniceny.cz"


def parse_date(date_str: str) -> Optional[datetime]:
    """Převede textové datum (např. '29.9.2026') na datetime."""
    if not date_str:
        return None
    try:
        parts = date_str.strip().split(".")
        if len(parts) == 3:
            day = int(parts[0])
            month = int(parts[1])
            year = int(parts[2])
            return datetime(year, month, day, 23, 59, 59)
    except Exception:
        pass
    return None


def search_akcniceny_deals(query: str, max_items: int = 20) -> List[Dict[str, Any]]:
    """
    Vyhledá akční nabídky na AkcniCeny.cz pro zadaný dotaz.
    Vrací seznam strukturovaných nabídek s obchodem, cenou a platností.
    """
    clean_query = query.strip()
    encoded = urllib.parse.quote(clean_query)
    url = f"{BASE_URL}/hledej/?s={encoded}"
    req = urllib.request.Request(url, headers=HEADERS)

    results: List[Dict[str, Any]] = []

    try:
        with urllib.request.urlopen(req, timeout=9) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as err:
        logger.warning("Chyba při stahování z AkcniCeny.cz pro '%s': %s", query, err)
        return []

    try:
        soup = BeautifulSoup(html, "html.parser")

        # 1. Zpracování promočních TOP karet v horní části
        for card in soup.find_all("div", class_=re.compile(r"col-12\s+col-md-6")):
            a_tag = card.find("a", href=re.compile(r"/akce/"))
            p_price = card.find("p", class_=re.compile(r"color-red|price", re.I))
            if a_tag and p_price:
                prod_title = a_tag.get("title") or a_tag.get_text(strip=True)
                href = a_tag.get("href", "")
                if href and not href.startswith("http"):
                    href = f"{BASE_URL}{href}"

                # Store z parametru utm_campaign
                store_match = re.search(r"utm_campaign=([a-z0-9_\-]+)", href, re.I)
                store_raw = store_match.group(1) if store_match else ""
                store_norm = normalize_store_name(store_raw) or normalize_store_name(card.get_text())

                price_nums = re.findall(r"(\d+[\d\s]*[,.]\d{2})", p_price.get_text())
                if price_nums and store_norm:
                    price_val = float(price_nums[0].replace(" ", "").replace(",", "."))
                    results.append({
                        "name": prod_title,
                        "store_name": store_norm,
                        "price": price_val,
                        "discount_price": price_val,
                        "valid_until": None,
                        "url": href,
                    })

        # 2. Zpracování produktových boxů (třída rounded-16)
        for box in soup.find_all("div", class_=re.compile(r"rounded-16")):
            title_a = box.find("a", href=re.compile(r"/akce/"))
            if not title_a:
                continue

            product_name = title_a.get("title") or title_a.get_text(strip=True)
            if not product_name or len(product_name) < 3:
                continue

            product_url = title_a.get("href", "")
            if product_url and not product_url.startswith("http"):
                product_url = f"{BASE_URL}{product_url}"

            # Extrakce data platnosti pro celý box, pokud existuje
            box_text = " ".join(box.stripped_strings)
            valid_dates = re.findall(r"Platí do:\s*(\d{1,2}\.\d{1,2}\.\d{4})", box_text)
            default_valid = parse_date(valid_dates[0]) if valid_dates else None

            # Procházení jednotlivých nabídek řetězců uvnitř boxu
            sub_rows = box.find_all("div", class_=re.compile(r"col-md-6|row"))
            for sub in sub_rows:
                sub_text = " ".join(sub.stripped_strings)
                if "Kč" not in sub_text:
                    continue

                for known_store in [
                    "Albert", "Billa", "Lidl", "Kaufland", "Tesco",
                    "Penny Market", "Penny", "Globus", "Coop", "Norma", "Makro"
                ]:
                    if re.search(rf"\b{known_store}\b", sub_text, re.I):
                        store_norm = normalize_store_name(known_store)
                        if not store_norm:
                            continue

                        # Extrakce cen: prioritně Clubcard / akční cena
                        clubcard_m = re.search(r"(?:cena|akce)\s*(\d+[\d\s]*[,.]\d{2})\s*Kč", sub_text, re.I)
                        all_prices = re.findall(r"(\d+[\d\s]*[,.]\d{2})\s*Kč", sub_text)

                        if clubcard_m:
                            chosen_price = float(clubcard_m.group(1).replace(" ", "").replace(",", "."))
                        elif all_prices:
                            # Nejnižší uvedená cena je obvykle akční
                            parsed_prices = [float(p.replace(" ", "").replace(",", ".")) for p in all_prices]
                            chosen_price = min(parsed_prices)
                        else:
                            continue

                        # Lokální datum platnosti
                        local_date_m = re.search(r"Platí do:\s*(\d{1,2}\.\d{1,2}\.\d{4})", sub_text)
                        valid_until = parse_date(local_date_m.group(1)) if local_date_m else default_valid

                        results.append({
                            "name": product_name,
                            "store_name": store_norm,
                            "price": chosen_price,
                            "discount_price": chosen_price,
                            "valid_until": valid_until,
                            "url": product_url,
                        })

    except Exception as e:
        logger.error("Chyba při parsování AkcniCeny.cz: %s", e)

    # Odstranění duplicit podle (name, store_name)
    seen = set()
    deduped = []
    for r in results:
        key = (r["name"].lower().strip(), r["store_name"].lower())
        if key not in seen:
            seen.add(key)
            deduped.append(r)
            if len(deduped) >= max_items:
                break

    return deduped


async def fetch_and_save_akcniceny_deals(
    db: AsyncSession,
    ingredient: Ingredient,
    search_keyword: Optional[str] = None,
) -> List[Product]:
    """
    Vyhledá nabídky na AkcniCeny.cz a uloží je do DB tabulek Product a ProductIngredient
    s využitím Fuzzy Matcheru pro přesné skóre.
    """
    query = search_keyword or extract_retail_search_term(ingredient.name)
    offers = search_akcniceny_deals(query, max_items=10)
    if not offers:
        return []

    stores_stmt = select(Store)
    stores = (await db.execute(stores_stmt)).scalars().all()
    store_map = {s.name.lower(): s for s in stores}

    saved_products: List[Product] = []

    for off in offers:
        store_name = off["store_name"]
        store = store_map.get(store_name.lower())
        if not store:
            store = Store(name=store_name)
            db.add(store)
            await db.flush()
            store_map[store_name.lower()] = store

        prod_stmt = select(Product).where(
            Product.store_id == store.id,
            Product.name == off["name"],
        )
        existing_prod = (await db.execute(prod_stmt)).scalars().first()

        if existing_prod:
            existing_prod.price = off["price"]
            existing_prod.discount_price = off["discount_price"]
            existing_prod.discount_valid_until = off["valid_until"]
            existing_prod.url = off["url"]
            target_prod = existing_prod
        else:
            target_prod = Product(
                store_id=store.id,
                name=off["name"],
                price=off["price"],
                discount_price=off["discount_price"],
                discount_valid_until=off["valid_until"],
                url=off["url"],
            )
            db.add(target_prod)
            await db.flush()

        # Fuzzy matching skóre
        match_score = IntelligentMatcher.calculate_match_score(ingredient.name, target_prod.name)

        link_stmt = select(ProductIngredient).where(
            ProductIngredient.product_id == target_prod.id,
            ProductIngredient.ingredient_id == ingredient.id,
        )
        existing_link = (await db.execute(link_stmt)).scalars().first()

        if not existing_link:
            new_link = ProductIngredient(
                product_id=target_prod.id,
                ingredient_id=ingredient.id,
                match_score=match_score,
            )
            db.add(new_link)
            await db.flush()
        else:
            existing_link.match_score = match_score

        saved_products.append(target_prod)

    if saved_products:
        await db.commit()

    return saved_products
