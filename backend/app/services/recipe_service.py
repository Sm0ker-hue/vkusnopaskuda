"""
recipe_service.py — Služba pro orchestraci receptů a nákupních seznamů.

Tento modul zajišťuje:
  1. search_dish: Vyhledání nebo vytvoření jídla a generování variant receptu s ohledem
     na dietní preference (vegan, bez lepku, bez laktózy) a alergeny (1–14).
  2. get_recipe_details_service: Načtení detailů receptu (ingredience, kroky, KBŽU).
     Pokud chybí nebo jsou v DB uloženy nevalidní placeholder/stub položky, automaticky
     je vyčistí a přegeneruje přes LLM nebo autentický český kulinářský fallback.
  3. create_shopping_list: Vytvoření nákupního košíku s vyloučením ingrediencí,
     které má uživatel již doma (řeší shodu ID na úrovni RecipeIngredient i Ingredient).
"""
import uuid
import logging
from typing import Optional, List, Dict, Any

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Dish,
    RecipeVariation,
    RecipeIngredient,
    RecipeStep,
    Ingredient,
    ShoppingList,
    ShoppingListItem,
)
from app.services.llm_service import generate_dish_variations, generate_recipe_details

logger = logging.getLogger(__name__)


def _parse_int(val: Any, default: int = 20) -> int:
    """Bezpečně převede hodnotu na int. Odstraní jednotky (např. '45 min' -> 45)."""
    if isinstance(val, int):
        return val
    if isinstance(val, float):
        return int(val)
    if isinstance(val, str):
        digits = "".join(ch for ch in val if ch.isdigit())
        if digits:
            try:
                return int(digits)
            except ValueError:
                pass
    return default


def _parse_float(val: Any, default: float = 0.0) -> float:
    """Bezpečně převede hodnotu na float. Ošetří desetinné čárky i textové jednotky."""
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        cleaned = "".join(ch for ch in val if ch.isdigit() or ch in ".,")
        cleaned = cleaned.replace(",", ".")
        if cleaned:
            try:
                return float(cleaned)
            except ValueError:
                pass
    return default


# ═══════════════════════════════════════════════════════════════════════════
# VYHLEDÁVÁNÍ A GENEROVÁNÍ VARIANT JÍDLA
# ═══════════════════════════════════════════════════════════════════════════

async def search_dish(
    db: AsyncSession,
    dish_name: str,
    preferences: Optional[Dict[str, Any]] = None,
    user_id: Optional[uuid.UUID] = None,
) -> Dict[str, Any]:
    """
    Vyhledá existující jídlo v databázi nebo vytvoří nový záznam a vygeneruje varianty.

    Pokud uživatel specifikoval dietní omezení (vegan, bez lepku, atd.),
    předchozí zastaralé varianty se smažou a vygenerují znovu na míru.
    """
    # 1. Vyhledání nebo založení jídla podle názvu
    stmt = select(Dish).where(Dish.name.ilike(f"%{dish_name.strip()}%"))
    result = await db.execute(stmt)
    dish = result.scalars().first()

    if not dish:
        dish = Dish(name=dish_name.strip())
        db.add(dish)
        await db.flush()

    # 2. Kontrola existujících variant pro dané jídlo
    var_stmt = select(RecipeVariation).where(RecipeVariation.dish_id == dish.id)
    existing_vars = (await db.execute(var_stmt)).scalars().all()

    # Detekce aktivních dietních omezení
    has_dietary_constraints = bool(
        preferences
        and any([
            preferences.get("is_vegan"),
            preferences.get("is_vegetarian"),
            preferences.get("is_keto"),
            preferences.get("is_gluten_free"),
            preferences.get("is_lactose_free"),
            preferences.get("excluded_allergens"),
        ])
    )

    # Pokud varianty chybí nebo se změnily preference, generujeme nové
    if not existing_vars or has_dietary_constraints:
        if existing_vars and has_dietary_constraints:
            logger.info("Mazání zastaralých variant pro jídlo '%s' kvůli dietním filtrům.", dish.name)
            await db.execute(delete(RecipeVariation).where(RecipeVariation.dish_id == dish.id))
            await db.flush()

        variations_data = await generate_dish_variations(dish_name, preferences)
        created_vars: List[RecipeVariation] = []

        for var_data in variations_data:
            variation = RecipeVariation(
                dish_id=dish.id,
                name=var_data.get("name", ""),
                description=var_data.get("description", ""),
                prep_time_minutes=_parse_int(var_data.get("prep_time") or var_data.get("prep_time_minutes"), 20),
                cook_time_minutes=_parse_int(var_data.get("cook_time") or var_data.get("cook_time_minutes"), 30),
                kcal=_parse_float(var_data.get("kcal"), 450.0),
                protein=_parse_float(var_data.get("protein"), 25.0),
                fat=_parse_float(var_data.get("fat"), 15.0),
                carbs=_parse_float(var_data.get("carbs"), 40.0),
            )
            db.add(variation)
            created_vars.append(variation)

        await db.commit()

    return {"dish_id": str(dish.id), "name": dish.name, "status": "variations_ready"}


# ═══════════════════════════════════════════════════════════════════════════
# NAČTENÍ A GENEROVÁNÍ DETAILŮ RECEPTU (INGREDIENCE, KROKY, KBŽU)
# ═══════════════════════════════════════════════════════════════════════════

# Slova indikující neplatné placeholder záznamy v DB
_STUB_KEYWORDS = ("čerstvé suroviny na", "hlavní surovina pro")


async def get_recipe_details_service(
    db: AsyncSession, recipe_id: uuid.UUID
) -> Optional[Dict[str, Any]]:
    """
    Načte kompletní recept: ingredience z českých obchodů, kroky přípravy, nutriční hodnoty.

    Automatická ochrana integrity dat:
    - Pokud záznam v DB obsahuje méně než 3 ingredience nebo generický placeholder text,
      záznamy se okamžitě promažou a vygeneruje se plnohodnotný recept z presetu nebo LLM.
    """
    # 1. Načtení varianty receptu
    stmt = select(RecipeVariation).where(RecipeVariation.id == recipe_id)
    variation = (await db.execute(stmt)).scalars().first()
    if not variation:
        return None

    # 2. Načtení existujících ingrediencí
    stmt_ings = (
        select(RecipeIngredient, Ingredient)
        .join(Ingredient, RecipeIngredient.ingredient_id == Ingredient.id)
        .where(RecipeIngredient.recipe_id == recipe_id)
    )
    existing_ing_rows = (await db.execute(stmt_ings)).all()

    # 3. Načtení existujících kroků
    step_stmt = select(RecipeStep).where(RecipeStep.recipe_id == recipe_id)
    existing_steps = (await db.execute(step_stmt)).scalars().all()

    # 4. Detekce poškozených či stub záznamů nebo nesouladu surovin s názvem receptu
    is_corrupt_stub = False
    if existing_ing_rows:
        if len(existing_ing_rows) < 3:
            is_corrupt_stub = True
        else:
            var_lower = (variation.name + " " + (variation.description or "")).lower()
            stored_ing_names = " ".join((ing.name or "").lower() for _, ing in existing_ing_rows)

            # Detekce zjevných stub textů
            for ri, ing in existing_ing_rows:
                lower_name = (ing.name or "").lower()
                if any(stub in lower_name for stub in _STUB_KEYWORDS):
                    is_corrupt_stub = True
                    break

            # Detekce nesouladu surovin (např. v názvu hlíva/tofu/vegan/krůta/losos, ale v DB uložené hovězí z dřívějšího presetu)
            if not is_corrupt_stub:
                if ("hlív" in var_lower or "houb" in var_lower) and "hověz" in stored_ing_names:
                    is_corrupt_stub = True
                elif ("tofu" in var_lower or "vegan" in var_lower or "rostlinn" in var_lower) and any(m in stored_ing_names for m in ("hověz", "vepř", "sádlo", "klobás")):
                    is_corrupt_stub = True
                elif "krůt" in var_lower and "hověz" in stored_ing_names:
                    is_corrupt_stub = True
                elif "kachn" in var_lower and "hověz" in stored_ing_names:
                    is_corrupt_stub = True
                elif any(f in var_lower for f in ("losos", "ryb", "pstruh")) and any(m in stored_ing_names for m in ("hověz", "vepř", "kuřec")):
                    is_corrupt_stub = True
                elif ("kuřec" in var_lower or "kure" in var_lower) and "hověz" in stored_ing_names:
                    is_corrupt_stub = True
                elif any(g in var_lower for g in ("jelen", "zvěřin", "kanč", "srnč")) and "hověz" in stored_ing_names:
                    is_corrupt_stub = True

    # 5. Pokud chybí data nebo jsou poškozená, přegenerujeme
    if not existing_ing_rows or not existing_steps or is_corrupt_stub:
        if is_corrupt_stub:
            logger.warning("Detekován poškozený recept %s — provádím promazání a přegenerování.", recipe_id)
            await db.execute(delete(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id))
            await db.execute(delete(RecipeStep).where(RecipeStep.recipe_id == recipe_id))
            await db.flush()

        # Generování přes Gemini nebo český kulinářský fallback
        details = await generate_recipe_details(variation.name, variation.description or "")

        # Uložení surovin
        if details.get("ingredients"):
            for ing_data in details["ingredients"]:
                ing_name = ing_data.get("name", "").strip()
                if not ing_name:
                    continue

                # Zkontrolovat existenci v číselníku Ingredient
                find_ing = select(Ingredient).where(Ingredient.name == ing_name)
                db_ing = (await db.execute(find_ing)).scalars().first()
                if not db_ing:
                    db_ing = Ingredient(
                        name=ing_name,
                        kcal_per_100g=_parse_float(ing_data.get("kcal"), 100.0),
                        protein_per_100g=_parse_float(ing_data.get("protein"), 10.0),
                        fat_per_100g=_parse_float(ing_data.get("fat"), 5.0),
                        carbs_per_100g=_parse_float(ing_data.get("carbs"), 10.0),
                    )
                    db.add(db_ing)
                    await db.flush()

                recipe_ing = RecipeIngredient(
                    recipe_id=variation.id,
                    ingredient_id=db_ing.id,
                    amount=_parse_float(ing_data.get("amount"), 100.0),
                    unit=str(ing_data.get("unit", "g")),
                )
                db.add(recipe_ing)

        # Uložení kroků přípravy
        if details.get("steps"):
            for step_data in details["steps"]:
                recipe_step = RecipeStep(
                    recipe_id=variation.id,
                    step_number=_parse_int(step_data.get("step_number"), 1),
                    instruction=str(step_data.get("instruction", "")),
                )
                db.add(recipe_step)

        # Aktualizace nutričních hodnot ve variantě
        if details.get("total_nutrition"):
            nut = details["total_nutrition"]
            if nut.get("kcal") is not None:
                variation.kcal = _parse_float(nut["kcal"], 500.0)
            if nut.get("protein") is not None:
                variation.protein = _parse_float(nut["protein"], 30.0)
            if nut.get("fat") is not None:
                variation.fat = _parse_float(nut["fat"], 20.0)
            if nut.get("carbs") is not None:
                variation.carbs = _parse_float(nut["carbs"], 45.0)

        await db.commit()

    # 6. Znovu načíst uložené ingredience a kroky
    stmt_ings = (
        select(RecipeIngredient, Ingredient)
        .join(Ingredient, RecipeIngredient.ingredient_id == Ingredient.id)
        .where(RecipeIngredient.recipe_id == recipe_id)
    )
    ing_rows = (await db.execute(stmt_ings)).all()

    stmt_steps = (
        select(RecipeStep)
        .where(RecipeStep.recipe_id == recipe_id)
        .order_by(RecipeStep.step_number)
    )
    step_rows = (await db.execute(stmt_steps)).scalars().all()

    return {
        "id": str(variation.id),
        "dish_id": str(variation.dish_id),
        "name": variation.name,
        "description": variation.description,
        "prep_time_minutes": variation.prep_time_minutes or 20,
        "cook_time_minutes": variation.cook_time_minutes or 30,
        "nutrition": {
            "calories": float(variation.kcal) if variation.kcal else 450,
            "protein": float(variation.protein) if variation.protein else 25,
            "fat": float(variation.fat) if variation.fat else 15,
            "carbs": float(variation.carbs) if variation.carbs else 40,
        },
        "ingredients": [
            {
                # id vracíme jako ingredient_id pro přímou kompatibilitu s nákupním košíkem
                "id": str(ing.id),
                "ingredient_id": str(ing.id),
                "recipe_ingredient_id": str(ri.id),
                "name": ing.name,
                "amount": float(ri.amount),
                "unit": ri.unit,
                "category": "Suroviny",
            }
            for ri, ing in ing_rows
        ],
        "steps": [
            {
                "step_number": s.step_number,
                "instruction": s.instruction,
            }
            for s in step_rows
        ],
    }


async def get_recipe_ingredients(db: AsyncSession, recipe_id: uuid.UUID) -> List[Dict[str, Any]]:
    """Vrátí seznam ingrediencí pro daný recept."""
    details = await get_recipe_details_service(db, recipe_id)
    if details and "ingredients" in details:
        return details["ingredients"]
    return []


# ═══════════════════════════════════════════════════════════════════════════
# VYTVOŘENÍ NÁKUPNÍHO SEZNAMU (VYLUČUJE DOMA DOSTUPNÉ SUROVINY)
# ═══════════════════════════════════════════════════════════════════════════

async def create_shopping_list(
    db: AsyncSession,
    recipe_id: uuid.UUID,
    user_id: uuid.UUID,
    owned_ingredients: List[Any],
) -> Dict[str, Any]:
    """
    Vytvoří nákupní košík a přidá pouze položky, které uživatel NEMÁ doma.

    ROBUSTNOST:
    Frontend může poslat seznam ID jako řetězce nebo UUID, odpovídající buď
    `Ingredient.id` nebo `RecipeIngredient.id`. Kontrolujeme obojí, takže
    žádná označená položka neskončí omylem v nákupním seznamu.
    """
    stmt = select(RecipeIngredient).where(RecipeIngredient.recipe_id == recipe_id)
    result = await db.execute(stmt)
    recipe_ingredients = result.scalars().all()

    sl = ShoppingList(user_id=user_id, recipe_id=recipe_id)
    db.add(sl)
    await db.flush()

    # Normalizace označených ID na sadu stringů pro rychlé a spolehlivé porovnání
    owned_set = {str(x).strip().lower() for x in owned_ingredients if x}

    missing: List[str] = []
    for ri in recipe_ingredients:
        ing_id_str = str(ri.ingredient_id).lower()
        ri_id_str = str(ri.id).lower()

        # Pokud uživatel surovinu má (ať už poslal ID suroviny nebo vazební ID receptu), přeskočíme
        if ing_id_str in owned_set or ri_id_str in owned_set:
            continue

        item = ShoppingListItem(
            shopping_list_id=sl.id,
            ingredient_id=ri.ingredient_id,
            amount=ri.amount,
            unit=ri.unit,
        )
        db.add(item)
        missing.append(str(ri.ingredient_id))

    await db.commit()
    return {"shopping_list_id": str(sl.id), "missing_ingredients_count": len(missing)}
