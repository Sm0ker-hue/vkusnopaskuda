"""
kupi_service.py — Služba pro získávání reálných akčních a běžných cen z Kupi.cz.

Využívá oficiální strukturovaná data schema.org/Product (JSON-LD), která Kupi.cz
přikládá do každé stránky produktu. Extrahuje:
  - Reálný název produktu a značky (např. 'Máslo Jihočeské Madeta 250g')
  - Reálnou cenu v Kč (CZK)
  - Prodejce / obchodní řetězec (Billa, Albert, Lidl, Kaufland, Tesco, Penny, Globus)
  - Dobu platnosti akce / ceny (priceValidUntil)
  - Přímý odkaz na nabídku
"""
import re
import json
import urllib.request
import asyncio
import urllib.parse
import logging
from typing import Dict, Any, List, Optional, Set, Tuple
from datetime import datetime, date

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.store import Store
from app.models.product import Product, ProductIngredient
from app.models.ingredient import Ingredient
from app.services.matcher_service import IntelligentMatcher

logger = logging.getLogger(__name__)

# Standardní hlavičky prohlížeče
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
}

# Mapování názvů z Kupi.cz na standardní názvy v naší DB
STORE_NAME_MAPPING = {
    "billa": "Billa",
    "albert": "Albert",
    "albert hypermarket": "Albert",
    "albert supermarket": "Albert",
    "lidl": "Lidl",
    "kaufland": "Kaufland",
    "tesco": "Tesco",
    "tesco hypermarket": "Tesco",
    "tesco extra": "Tesco",
    "tesco supermarket": "Tesco",
    "penny": "Penny Market",
    "penny market": "Penny Market",
    "globus": "Globus",
    "makro": "Makro",
    "coop": "Coop",
    "norma": "Norma",
    "rohlík": "Rohlík",
    "rohlik": "Rohlík",
    "rohlík.cz": "Rohlík",
    "košík": "Košík",
    "kosik": "Košík",
    "košík.cz": "Košík",
}


def normalize_store_name(raw_name: str) -> Optional[str]:
    """Převede název obchodu z Kupi.cz na standardní název řetězce v DB."""
    if not raw_name:
        return None
    cleaned = raw_name.strip().lower()
    for key, mapped in STORE_NAME_MAPPING.items():
        if key == cleaned or cleaned.startswith(key):
            return mapped
    return None


def extract_retail_search_term(ingredient_name: str) -> str:
    """
    Převede detailní kuchařský název suroviny na optimalizovaný vyhledávací dotaz pro Kupi.cz.
    Např. 'Máslo 82%' -> 'máslo', 'Brambory varný typ B' -> 'brambory'.
    """
    lower = ingredient_name.lower()
    if "máslo" in lower:
        return "máslo"
    if "brambor" in lower:
        return "brambory"
    if "hověz" in lower or "kližk" in lower:
        return "hovězí maso"
    if "kuřec" in lower or "kure" in lower:
        return "kuře"
    if "vepř" in lower or "sádlo" in lower:
        return "vepřové maso"
    if "smetan" in lower:
        return "smetana"
    if "mlék" in lower or "mlek" in lower:
        return "mléko"
    if "vejce" in lower:
        return "vejce"
    if "mouk" in lower:
        return "mouka"
    if "cibul" in lower:
        return "cibule"
    if "česnek" in lower or "cesnek" in lower:
        return "česnek"
    if "eidam" in lower:
        return "eidam"
    if "hermelín" in lower or "hermelin" in lower:
        return "hermelín"
    if "klobás" in lower:
        return "klobása"
    if "špekáč" in lower or "špek" in lower:
        return "špekáčky"
    if "hlív" in lower:
        return "hlíva"
    if "žamp" in lower:
        return "žampiony"
    if "houb" in lower:
        return "houby"
    if "tofu" in lower:
        return "tofu"
    if "tempeh" in lower:
        return "tempeh"
    if "olej" in lower:
        return "olej"
    if "mrkev" in lower:
        return "mrkev"
    if "celer" in lower:
        return "celer"
    if "petržel" in lower:
        return "petržel"
    if "kořenová zelenina" in lower:
        return "kořenová zelenina"
    if "tatarsk" in lower:
        return "tatarská omáčka"
    if "hořčic" in lower:
        return "hořčice"
    if "protlak" in lower:
        return "rajčatový protlak"
    if "losos" in lower:
        return "losos"
    if "kopr" in lower:
        return "kopr"
    if "brusink" in lower:
        return "brusinky"
    if "strouhank" in lower:
        return "strouhanka"
    if "kmín" in lower or "kmin" in lower:
        return "kmín"
    if "majoránk" in lower:
        return "majoránka"
    if "paprik" in lower and "mlet" in lower:
        return "paprika mletá"

    clean = re.sub(r'\(.*?\)', '', ingredient_name)
    clean = re.sub(r'\d+%', '', clean)
    clean = re.sub(r'\d+\s*(?:g|kg|ml|l|ks|lžíce|lžička)', '', clean, flags=re.IGNORECASE)
    words = clean.strip().split()
    return words[0] if words else ingredient_name


def search_kupi_links(query: str, max_links: int = 5) -> List[str]:
    """
    Vyhledá na Kupi.cz odkazy na produkty odpovídající zadanému dotazu.
    Vrací seznam relativních cest např. ['/sleva/maslo-jihoceske-madeta', ...]
    """
    encoded = urllib.parse.quote(query.strip())
    url = f"https://www.kupi.cz/hledej?f={encoded}&vse=0"
    req = urllib.request.Request(url, headers=HEADERS)

    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            # Najdeme všechny odkazy na /sleva/...
            links = re.findall(r'href="(/sleva/[a-zA-Z0-9\-]+)"', html)
            seen = set()
            unique_links = []
            for link in links:
                if link not in seen:
                    seen.add(link)
                    unique_links.append(link)
                    if len(unique_links) >= max_links:
                        break
            return unique_links
    except Exception as err:
        logger.warning("Chyba při vyhledávání na Kupi.cz pro '%s': %s", query, err)
        return []


def parse_product_page_offers(sleva_path: str) -> Optional[Dict[str, Any]]:
    """
    Stáhne stránku konkrétního produktu a vyextrahuje z ní JSON-LD schéma Product a AggregateOffer.
    """
    url = f"https://www.kupi.cz{sleva_path}"
    req = urllib.request.Request(url, headers=HEADERS)

    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            scripts = re.findall(
                r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',
                html,
                re.DOTALL,
            )

            for script in scripts:
                try:
                    data = json.loads(script)
                    if data.get("@type") == "Product" and "offers" in data:
                        raw_offers = data["offers"].get("offers", [])
                        parsed_offers = []

                        for off in raw_offers:
                            store_raw = off.get("offeredBy")
                            store_norm = normalize_store_name(store_raw)
                            if not store_norm:
                                continue

                            try:
                                price_val = float(off.get("price", 0.0))
                            except (ValueError, TypeError):
                                continue

                            if price_val <= 0:
                                continue

                            valid_until_str = off.get("priceValidUntil")
                            valid_until = None
                            if valid_until_str:
                                try:
                                    valid_until = datetime.fromisoformat(valid_until_str)
                                except Exception:
                                    pass

                            parsed_offers.append({
                                "store_name": store_norm,
                                "price": price_val,
                                "currency": off.get("priceCurrency", "CZK"),
                                "valid_until": valid_until,
                                "valid_until_str": valid_until_str,
                            })

                        return {
                            "product_name": data.get("name", "").strip(),
                            "url": url,
                            "low_price": data["offers"].get("lowPrice"),
                            "high_price": data["offers"].get("highPrice"),
                            "offers": parsed_offers,
                        }
                except Exception:
                    continue
    except Exception as err:
        logger.warning("Chyba při parsování produktu '%s': %s", sleva_path, err)

    return None


# ═══════════════════════════════════════════════════════════════════════════
# HLAVNÍ METODA PRO ZÍSKÁNÍ A ULOŽENÍ CEN INGREDIENCE DO DATABÁZE
# ═══════════════════════════════════════════════════════════════════════════

async def fetch_and_save_ingredient_deals(
    db: AsyncSession,
    ingredient: Ingredient,
    search_keyword: Optional[str] = None,
) -> List[Product]:
    """
    Vyhledá na Kupi.cz nabídky pro danou ingredienci a uloží/aktualizuje je v DB tabulkách
    Product a ProductIngredient bez duplikátů.
    """
    clean_query = search_keyword or extract_retail_search_term(ingredient.name)
    links = search_kupi_links(clean_query, max_links=3)
    if not links:
        logger.info("Žádné odkazy na Kupi.cz pro dotaz '%s'", clean_query)
        return []

    stores_stmt = select(Store)
    stores = (await db.execute(stores_stmt)).scalars().all()
    store_map = {s.name.lower(): s for s in stores}

    saved_products: List[Product] = []
    seen_links: Set[Tuple[Any, Any]] = set()

    for link in links:
        prod_data = parse_product_page_offers(link)
        if not prod_data or not prod_data.get("offers"):
            continue

        prod_name = prod_data["product_name"]
        prod_url = prod_data["url"]

        for offer in prod_data["offers"]:
            store_name = offer["store_name"]
            store = store_map.get(store_name.lower())
            if not store:
                store = Store(name=store_name)
                db.add(store)
                await db.flush()
                store_map[store_name.lower()] = store

            prod_stmt = select(Product).where(
                Product.store_id == store.id,
                Product.name == prod_name,
            )
            existing_prod = (await db.execute(prod_stmt)).scalars().first()

            if existing_prod:
                existing_prod.price = offer["price"]
                existing_prod.discount_price = offer["price"]
                existing_prod.discount_valid_until = offer["valid_until"]
                existing_prod.url = prod_url
                target_product = existing_prod
            else:
                target_product = Product(
                    store_id=store.id,
                    name=prod_name,
                    price=offer["price"],
                    discount_price=offer["price"],
                    discount_valid_until=offer["valid_until"],
                    url=prod_url,
                )
                db.add(target_product)
                await db.flush()

            pair_key = (target_product.id, ingredient.id)
            if pair_key not in seen_links:
                seen_links.add(pair_key)
                link_stmt = select(ProductIngredient).where(
                    ProductIngredient.product_id == target_product.id,
                    ProductIngredient.ingredient_id == ingredient.id,
                )
                existing_link = (await db.execute(link_stmt)).scalars().first()
                if not existing_link:
                    new_link = ProductIngredient(
                        product_id=target_product.id,
                        ingredient_id=ingredient.id,
                        match_score=0.95,
                    )
                    db.add(new_link)
                    await db.flush()

            saved_products.append(target_product)

    if saved_products:
        await db.commit()

    return saved_products


# ═══════════════════════════════════════════════════════════════════════════
# SYNC CELÉHO KATALOGU ZÁKLADNÍCH SUROVIN (OPTIMALIZOVANÝ)
# ═══════════════════════════════════════════════════════════════════════════

ESSENTIAL_STAPLES_QUERIES = [
    ("máslo", ["máslo"]),
    ("brambory", ["brambory", "brambor"]),
    ("hovězí maso", ["hověz", "kližk"]),
    ("kuře", ["kuřec", "kure"]),
    ("vepřové maso", ["vepř", "sádlo"]),
    ("smetana", ["smetan"]),
    ("mléko", ["mlék", "mlek"]),
    ("vejce", ["vejce"]),
    ("mouka", ["mouk"]),
    ("cibule", ["cibul"]),
    ("česnek", ["česnek", "cesnek"]),
    ("eidam", ["eidam"]),
    ("hermelín", ["hermelín"]),
    ("klobása", ["klobás", "špek"]),
    ("houby", ["houb"]),
    ("hlíva", ["hlív"]),
    ("tofu", ["tofu"]),
    ("olej", ["olej"]),
    ("kořenová zelenina", ["kořenová zelenina", "mrkev", "celer", "petržel"]),
    ("tatarská omáčka", ["tatarsk"]),
    ("hořčice", ["hořčic"]),
    ("rajčatový protlak", ["protlak"]),
    ("losos", ["losos"]),
    ("kopr", ["kopr"]),
    ("brusinky", ["brusink"]),
    ("strouhanka", ["strouhank"]),
    ("kmín", ["kmín"]),
    ("majoránka", ["majoránk"]),
    ("paprika mletá", ["paprik"]),
]


async def sync_all_staple_deals(db: AsyncSession) -> Dict[str, Any]:
    """
    Projde všechny základní ingredience, stáhne nabídky z Kupi.cz ONCE na dotaz,
    uloží produkty do DB a propojí se všemi odpovídajícími ingrediencemi.
    """
    total_offers_saved = 0
    synced_staples = []

    # Načtení všech obchodů a ingrediencí v DB
    all_ings = (await db.execute(select(Ingredient))).scalars().all()
    stores = (await db.execute(select(Store))).scalars().all()
    store_map = {s.name.lower(): s for s in stores}

    seen_links: Set[Tuple[Any, Any]] = set()

    for retail_query, match_patterns in ESSENTIAL_STAPLES_QUERIES:
        matching_ings = [
            i for i in all_ings
            if any(p in i.name.lower() for p in match_patterns)
        ]

        if not matching_ings:
            continue

        links = await asyncio.to_thread(search_kupi_links, retail_query, 2)
        if not links:
            continue

        query_products: List[Product] = []

        for link in links:
            prod_data = await asyncio.to_thread(parse_product_page_offers, link)
            if not prod_data or not prod_data.get("offers"):
                continue

            prod_name = prod_data["product_name"]
            prod_url = prod_data["url"]

            for offer in prod_data["offers"]:
                store_name = offer["store_name"]
                store = store_map.get(store_name.lower())
                if not store:
                    store = Store(name=store_name)
                    db.add(store)
                    await db.flush()
                    store_map[store_name.lower()] = store

                prod_stmt = select(Product).where(
                    Product.store_id == store.id,
                    Product.name == prod_name,
                )
                existing_prod = (await db.execute(prod_stmt)).scalars().first()

                if existing_prod:
                    existing_prod.price = offer["price"]
                    existing_prod.discount_price = offer["price"]
                    existing_prod.discount_valid_until = offer["valid_until"]
                    existing_prod.url = prod_url
                    target_prod = existing_prod
                else:
                    target_prod = Product(
                        store_id=store.id,
                        name=prod_name,
                        price=offer["price"],
                        discount_price=offer["price"],
                        discount_valid_until=offer["valid_until"],
                        url=prod_url,
                    )
                    db.add(target_prod)
                    await db.flush()

                query_products.append(target_prod)

                # Propojit tento produkt se všemi matching_ings s reálným skóre
                for ing in matching_ings:
                    pair_key = (target_prod.id, ing.id)
                    if pair_key not in seen_links:
                        seen_links.add(pair_key)
                        score = IntelligentMatcher.calculate_match_score(ing.name, prod_name)
                        if score >= 0.55:
                            link_stmt = select(ProductIngredient).where(
                                ProductIngredient.product_id == target_prod.id,
                                ProductIngredient.ingredient_id == ing.id,
                            )
                            existing_link = (await db.execute(link_stmt)).scalars().first()
                            if not existing_link:
                                new_link = ProductIngredient(
                                    product_id=target_prod.id,
                                    ingredient_id=ing.id,
                                    match_score=score,
                                )
                                db.add(new_link)
                                await db.flush()
                            else:
                                existing_link.match_score = score

        await db.commit()
        total_offers_saved += len(query_products)
        synced_staples.append({
            "query": retail_query,
            "ingredients_linked": len(matching_ings),
            "offers_saved": len(query_products),
        })

    return {
        "status": "success",
        "total_offers_saved": total_offers_saved,
        "staples_processed": len(synced_staples),
        "details": synced_staples,
    }
