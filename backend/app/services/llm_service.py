"""
llm_service.py — Služba pro generování receptů přes Gemini API.

Zodpovědná za:
  1. Generování variant receptu (generate_dish_variations)
  2. Generování detailů receptu — ingredience, kroky, KBŽU (generate_recipe_details)
  3. Předdefinované presety českých jídel (get_dish_presets)
  4. Inteligentní kulinářský fallback (generate_culinary_fallback)

Architektura:
  Gemini API → JSON parse → validace → uložení do DB
  Pokud Gemini selže (503/404) → fallback na presety nebo kulinářský generátor.
  Placeholder/stub ingredience se NIKDY nevrací.
"""
import json
import logging
import re
from typing import Optional

from google import genai
from google.genai import types

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Konfigurace modelů Gemini (kaskádový fallback s aktivními modely)
# ---------------------------------------------------------------------------
AVAILABLE_MODELS: list[str] = [
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
]

# ---------------------------------------------------------------------------
# Oficiální české alergeny 1–14 (pro referenci v komentářích)
# 1=Lepek, 2=Korýši, 3=Vejce, 4=Ryby, 5=Arašídy, 6=Sója,
# 7=Mléko/Laktóza, 8=Ořechy, 9=Celer, 10=Hořčice,
# 11=Sezam, 12=Siřičitany, 13=Lupina, 14=Měkkýši
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Gemini klient
# ---------------------------------------------------------------------------

def get_gemini_client() -> Optional[genai.Client]:
    """Vrátí inicializovaný Gemini Client nebo None, pokud API klíč chybí."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        return None
    try:
        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning("Nelze vytvořit Gemini Client: %s", e)
        return None


# ═══════════════════════════════════════════════════════════════════════════
# PRESETY ČESKÝCH JÍDEL
# Autentické rozpisy surovin z českých supermarketů (Albert, Lidl, Billa).
# Každý preset obsahuje: ingredients, steps, allergens, total_nutrition.
# ═══════════════════════════════════════════════════════════════════════════

def _preset_svickova(lower: str) -> dict:
    """Svíčková na smetaně — tradiční, tofu, veganská, nízkokalorická."""
    is_tofu = "tofu" in lower
    is_vegan = "vegan" in lower or "rostlinn" in lower or is_tofu
    is_low_cal = any(kw in lower for kw in ("nízkokalor", "nizkokalor", "light", "diet", "fit"))

    # Hlavní protein podle varianty
    if is_tofu or is_vegan:
        protein = {"name": "Tofu bílé přírodní nebo uzené", "amount": 350, "unit": "g",
                   "kcal": 380, "protein": 42, "fat": 18, "carbs": 4}
    else:
        protein = {"name": "Hovězí zadní falešná svíčková", "amount": 600, "unit": "g",
                   "kcal": 720, "protein": 65, "fat": 35, "carbs": 0}

    # Smetana podle varianty
    if is_vegan:
        cream = {"name": "Ovesná nebo sójová smetana na vaření", "amount": 250, "unit": "ml",
                 "kcal": 320, "protein": 4, "fat": 20, "carbs": 8}
    elif is_low_cal:
        cream = {"name": "Zakysaná smetana 12% light", "amount": 250, "unit": "ml",
                 "kcal": 320, "protein": 4, "fat": 20, "carbs": 8}
    else:
        cream = {"name": "Smetana ke šlehání 33%", "amount": 250, "unit": "ml",
                 "kcal": 730, "protein": 6, "fat": 82, "carbs": 8}

    # Tuk
    fat_item = (
        {"name": "Řepkový olej", "amount": 40, "unit": "g", "kcal": 298, "protein": 0.3, "fat": 33, "carbs": 0.3}
        if is_vegan else
        {"name": "Čerstvé máslo 82%", "amount": 40, "unit": "g", "kcal": 298, "protein": 0.3, "fat": 33, "carbs": 0.3}
    )

    protein_label = "tofu" if (is_tofu or is_vegan) else "maso"

    return {
        "ingredients": [
            protein,
            {"name": "Kořenová zelenina (mrkev, celer, petržel)", "amount": 500, "unit": "g",
             "kcal": 160, "protein": 4, "fat": 0.8, "carbs": 34},
            cream,
            {"name": "Cibule žlutá kuchyňská", "amount": 2, "unit": "ks",
             "kcal": 70, "protein": 2, "fat": 0.2, "carbs": 15},
            {"name": "Divoké koření (bobkový list, nové koření, celý pepř)", "amount": 1, "unit": "balení",
             "kcal": 15, "protein": 0.5, "fat": 0.2, "carbs": 3},
            {"name": "Plnotučná hořčice", "amount": 2, "unit": "lžíce",
             "kcal": 30, "protein": 1.2, "fat": 1.8, "carbs": 2.2},
            {"name": "Citrón čerstvý", "amount": 1, "unit": "ks",
             "kcal": 20, "protein": 0.8, "fat": 0.2, "carbs": 4},
            fat_item,
            {"name": "Brusinkový kompot / terč", "amount": 100, "unit": "g",
             "kcal": 120, "protein": 0.3, "fat": 0.2, "carbs": 28},
        ],
        "steps": [
            {"step_number": 1, "instruction": f"Kořenovou zeleninu a cibuli očistěte a nakrájejte na kostičky. "
                                                f"{'Plátky tofu osušte a zlehka osolte.' if is_tofu or is_vegan else 'Hovězí maso prošpikujte, osolte a opepřete.'}"},
            {"step_number": 2, "instruction": f"V hlubokém hrnci rozehřejte tuk a opečte {protein_label} ze všech stran zprudka dozlatova. Odložte stranou."},
            {"step_number": 3, "instruction": "Do výpeku vsypte zeleninu a cibuli. Za stálého míchání opékejte 10–12 minut do sytě karamelové barvy."},
            {"step_number": 4, "instruction": "Přidejte hořčici, divoké koření, lžičku citronové šťávy a zalijte 500 ml vývaru. "
                                               f"{'Duste 15 minut.' if is_tofu or is_vegan else 'Vraťte maso a duste v troubě na 160 °C cca 90 minut.'}"},
            {"step_number": 5, "instruction": f"Vyjměte {protein_label} i kuličky koření. Zeleninu rozmixujte ponorným mixérem."},
            {"step_number": 6, "instruction": "Do omáčky vlijte smetanu, dochuťte citronovou šťávou a solí. Krátce prohřejte."},
            {"step_number": 7, "instruction": f"Podávejte s plátky {protein_label}, lžičkou brusinek a knedlíkem."},
        ],
        "allergens": [6, 9, 10] if (is_tofu or is_vegan) else [7, 9, 10],
        "total_nutrition": {
            "kcal": 390 if (is_tofu or is_low_cal) else 680,
            "protein": 34 if (is_tofu or is_low_cal) else 45,
            "fat": 15 if (is_tofu or is_low_cal) else 34,
            "carbs": 32 if (is_tofu or is_low_cal) else 48,
        },
    }


def _preset_bramboracka(lower: str) -> dict:
    """Bramboračka — tradiční polévka s houbami a klobásou (nebo veganská s tempehem)."""
    is_vegan = "vegan" in lower or "rostlinn" in lower
    return {
        "ingredients": [
            {"name": "Brambory konzumní pozdní", "amount": 600, "unit": "g",
             "kcal": 460, "protein": 12, "fat": 0.6, "carbs": 105},
            {"name": "Lesní houby sušené nebo čerstvé", "amount": 100, "unit": "g",
             "kcal": 40, "protein": 3, "fat": 0.5, "carbs": 6},
            {"name": "Uzený tempeh" if is_vegan else "Uzená klobása nebo uzené maso", "amount": 200, "unit": "g",
             "kcal": 420, "protein": 24, "fat": 32, "carbs": 2},
            {"name": "Kořenová zelenina (mrkev, celer, petržel)", "amount": 300, "unit": "g",
             "kcal": 95, "protein": 3, "fat": 0.5, "carbs": 20},
            {"name": "Česnek paličák český", "amount": 4, "unit": "stroužky",
             "kcal": 20, "protein": 1, "fat": 0.1, "carbs": 4},
            {"name": "Majoránka drhnutá", "amount": 1, "unit": "lžíce",
             "kcal": 10, "protein": 0.4, "fat": 0.2, "carbs": 2},
            {"name": "Řepkový olej" if is_vegan else "Čerstvé máslo 82%", "amount": 40, "unit": "g",
             "kcal": 298, "protein": 0.3, "fat": 33, "carbs": 0.3},
            {"name": "Hladká mouka (nebo rýžová bezlepková)", "amount": 30, "unit": "g",
             "kcal": 105, "protein": 3, "fat": 0.3, "carbs": 22},
            {"name": "Kmín drcený", "amount": 1, "unit": "lžička",
             "kcal": 15, "protein": 0.8, "fat": 0.6, "carbs": 1.5},
        ],
        "steps": [
            {"step_number": 1, "instruction": "Brambory a kořenovou zeleninu oloupejte a nakrájejte na kostičky. Houby zalijte teplou vodou a nechte 15 minut nabobtnat."},
            {"step_number": 2, "instruction": "V hrnci rozehřejte tuk a opečte uzeninu dozlatova. Přidejte kořenovou zeleninu a krátce orestujte."},
            {"step_number": 3, "instruction": "Zasypte moukou, za míchání připravte světlou jíšku. Postupně přilévejte 1,5 l vody a prošlehejte metličkou."},
            {"step_number": 4, "instruction": "Přidejte brambory, houby s tekutinou, kmín, sůl a pepř. Vařte 15–20 minut doměkka."},
            {"step_number": 5, "instruction": "Prolisujte česnek, přidejte promnutou majoránku. Krátce prohřejte a podávejte."},
        ],
        "allergens": [6, 9] if is_vegan else [1, 9],
        "total_nutrition": {"kcal": 520, "protein": 22, "fat": 18, "carbs": 65},
    }


def _preset_gulas(lower: str) -> dict:
    """Hovězí guláš — tradiční nebo veganský s hlívou."""
    is_vegan = "vegan" in lower or "rostlinn" in lower
    return {
        "ingredients": [
            {"name": "Hlíva ústřičná a uzené tofu" if is_vegan else "Hovězí kližka na guláš", "amount": 600, "unit": "g",
             "kcal": 580 if is_vegan else 780, "protein": 40 if is_vegan else 75, "fat": 18 if is_vegan else 42, "carbs": 10 if is_vegan else 0},
            {"name": "Cibule žlutá kuchyňská", "amount": 500, "unit": "g",
             "kcal": 180, "protein": 5, "fat": 0.5, "carbs": 40},
            {"name": "Paprika sladká mletá maďarská", "amount": 2, "unit": "lžíce",
             "kcal": 45, "protein": 2, "fat": 1.5, "carbs": 6},
            {"name": "Česnek český", "amount": 4, "unit": "stroužky",
             "kcal": 20, "protein": 1, "fat": 0.1, "carbs": 4},
            {"name": "Řepkový olej" if is_vegan else "Vepřové sádlo", "amount": 50, "unit": "g",
             "kcal": 440, "protein": 0, "fat": 50, "carbs": 0},
            {"name": "Rajčatový protlak zahuštěný", "amount": 2, "unit": "lžíce",
             "kcal": 35, "protein": 1.5, "fat": 0.2, "carbs": 7},
            {"name": "Majoránka drhnutá", "amount": 1, "unit": "lžíce",
             "kcal": 10, "protein": 0.4, "fat": 0.2, "carbs": 2},
            {"name": "Kmín drcený", "amount": 1, "unit": "lžička",
             "kcal": 15, "protein": 0.8, "fat": 0.6, "carbs": 1.5},
        ],
        "steps": [
            {"step_number": 1, "instruction": "Cibuli nakrájejte nadrobno, maso nebo houby na kostky 3×3 cm."},
            {"step_number": 2, "instruction": "V hlubokém hrnci rozpalte tuk a cibuli pomalu smažte do sytě hnědé barvy."},
            {"step_number": 3, "instruction": "Přidejte základ, zprudka zatáhněte. Vmíchejte protlak, papriku a kmín, zalijte vývarem."},
            {"step_number": 4, "instruction": "Osolte, opepřete a duste pod pokličkou na mírném plameni doměkka."},
            {"step_number": 5, "instruction": "Na závěr prolisujte česnek a přidejte promnutou majoránku. Podávejte s houskovým knedlíkem."},
        ],
        "allergens": [] if is_vegan else [1],
        "total_nutrition": {"kcal": 650, "protein": 45, "fat": 35, "carbs": 32},
    }


def _preset_kulajda() -> dict:
    """Jihočeská kulajda s houbami, koprem a ztraceným vejcem."""
    return {
        "ingredients": [
            {"name": "Brambory varný typ B", "amount": 500, "unit": "g",
             "kcal": 380, "protein": 10, "fat": 0.5, "carbs": 88},
            {"name": "Čerstvé nebo sušené lesní houby", "amount": 150, "unit": "g",
             "kcal": 55, "protein": 4, "fat": 0.6, "carbs": 8},
            {"name": "Zakysaná smetana 16%", "amount": 200, "unit": "g",
             "kcal": 340, "protein": 5, "fat": 32, "carbs": 7},
            {"name": "Čerstvý kopr svazek", "amount": 1, "unit": "svazek",
             "kcal": 15, "protein": 1, "fat": 0.2, "carbs": 2},
            {"name": "Čerstvá slepičí vejce", "amount": 4, "unit": "ks",
             "kcal": 300, "protein": 24, "fat": 20, "carbs": 2},
            {"name": "Máslo čerstvé 82%", "amount": 35, "unit": "g",
             "kcal": 260, "protein": 0.3, "fat": 29, "carbs": 0.3},
            {"name": "Hladká mouka", "amount": 30, "unit": "g",
             "kcal": 105, "protein": 3, "fat": 0.3, "carbs": 22},
            {"name": "Kmín celý a bobkový list", "amount": 1, "unit": "balení",
             "kcal": 15, "protein": 0.5, "fat": 0.5, "carbs": 2},
        ],
        "steps": [
            {"step_number": 1, "instruction": "Brambory oloupejte a nakrájejte na kostky. Houby očistěte a nakrájejte na plátky."},
            {"step_number": 2, "instruction": "V hrnci uvařte brambory s houbami, kmínem a bobkovým listem do poloměkka (cca 10 min)."},
            {"step_number": 3, "instruction": "Z másla a mouky připravte světlou jíšku, rozmíchejte ve vodě a zahustěte polévku."},
            {"step_number": 4, "instruction": "Vmíchejte zakysanou smetanu a nechte 5 minut probublávat."},
            {"step_number": 5, "instruction": "Vypněte oheň, vmíchejte kopr, dochuťte octem a solí. Podávejte se zastřeným vejcem."},
        ],
        "allergens": [1, 3, 7],
        "total_nutrition": {"kcal": 490, "protein": 18, "fat": 24, "carbs": 48},
    }


def _preset_kure_na_paprice() -> dict:
    """Kuře na paprice se smetanovou omáčkou."""
    return {
        "ingredients": [
            {"name": "Kuřecí stehenní nebo prsní řízky", "amount": 600, "unit": "g",
             "kcal": 680, "protein": 70, "fat": 18, "carbs": 0},
            {"name": "Paprika sladká lahůdková mletá", "amount": 2, "unit": "lžíce",
             "kcal": 45, "protein": 2, "fat": 1.5, "carbs": 6},
            {"name": "Smetana ke šlehání 33%", "amount": 250, "unit": "ml",
             "kcal": 730, "protein": 6, "fat": 82, "carbs": 8},
            {"name": "Cibule žlutá", "amount": 2, "unit": "ks",
             "kcal": 70, "protein": 2, "fat": 0.2, "carbs": 15},
            {"name": "Čerstvé máslo", "amount": 40, "unit": "g",
             "kcal": 298, "protein": 0.3, "fat": 33, "carbs": 0.3},
            {"name": "Kuřecí vývar", "amount": 500, "unit": "ml",
             "kcal": 40, "protein": 4, "fat": 1.5, "carbs": 2},
        ],
        "steps": [
            {"step_number": 1, "instruction": "Kuřecí maso osolte a opepřete. Cibuli nakrájejte nadrobno."},
            {"step_number": 2, "instruction": "Na másle orestujte cibuli dosklovata, přidejte maso a zprudka opečte."},
            {"step_number": 3, "instruction": "Přisypte papriku, promíchejte a ihned zalijte horkým vývarem."},
            {"step_number": 4, "instruction": "Přiklopte a duste na mírném ohni 30–35 minut doměkka."},
            {"step_number": 5, "instruction": "Maso vyjměte, omáčku rozmixujte, vlijte smetanu a nechte provařit. Podávejte s knedlíkem."},
        ],
        "allergens": [7],
        "total_nutrition": {"kcal": 580, "protein": 38, "fat": 36, "carbs": 22},
    }


def _preset_smazeny_syr() -> dict:
    """Smažený sýr s vařenými bramborami a tatarskou omáčkou."""
    return {
        "ingredients": [
            {"name": "Sýr Eidam 30% bloček", "amount": 400, "unit": "g",
             "kcal": 1040, "protein": 104, "fat": 64, "carbs": 4},
            {"name": "Brambory přílohové varný typ A", "amount": 600, "unit": "g",
             "kcal": 450, "protein": 12, "fat": 0.6, "carbs": 102},
            {"name": "Strouhanka světlá", "amount": 150, "unit": "g",
             "kcal": 525, "protein": 16, "fat": 3, "carbs": 108},
            {"name": "Hladká mouka pšeničná", "amount": 80, "unit": "g",
             "kcal": 280, "protein": 8, "fat": 0.8, "carbs": 60},
            {"name": "Čerstvá vejce", "amount": 2, "unit": "ks",
             "kcal": 150, "protein": 12, "fat": 10, "carbs": 1},
            {"name": "Tatarská omáčka Hellmanns", "amount": 100, "unit": "g",
             "kcal": 450, "protein": 1, "fat": 48, "carbs": 4},
            {"name": "Řepkový olej na smažení", "amount": 100, "unit": "ml",
             "kcal": 880, "protein": 0, "fat": 100, "carbs": 0},
        ],
        "steps": [
            {"step_number": 1, "instruction": "Eidam nakrájejte na plátky 1,5 cm silné. Brambory dejte vařit do osolené vody s kmínem."},
            {"step_number": 2, "instruction": "Připravte trojobal: mouka → rozšlehaná vejce → strouhanka."},
            {"step_number": 3, "instruction": "Sýr obalte v trojobalu, poté znovu ve vejci a strouhance (dvojitý obal)."},
            {"step_number": 4, "instruction": "V pánvi rozpalte olej a smažte dozlatova cca 1,5–2 minuty z každé strany."},
            {"step_number": 5, "instruction": "Nechte okapat na utěrce. Podávejte s bramborami s máslem a tatarkou."},
        ],
        "allergens": [1, 3, 7],  # Lepek, Vejce, Mléko
        "total_nutrition": {"kcal": 820, "protein": 42, "fat": 48, "carbs": 62},
    }


# ---------------------------------------------------------------------------
# Hlavní dispatcher presetů
# ---------------------------------------------------------------------------

def get_dish_presets(dish_name: str) -> Optional[dict]:
    """
    Vrátí autentický preset českého jídla podle názvu.

    Pořadí matchování: specifičtější vzory (svíčková, smažený sýr)
    se testují PŘED generickými (brambor), aby nedocházelo k falešným shodám
    (např. "smažený sýr s bramborami" nesmí matchnout bramboračku).
    """
    lower = dish_name.lower()

    # 1. Svíčková — tradiční, tofu, veganská, fitness (pouze pokud v názvu není jiný specifický protein)
    if ("svíčk" in lower or "svick" in lower) and not any(kw in lower for kw in ("hlív", "houb", "jelen", "zvěřin", "zverin", "krůt", "krut", "kachn", "losos", "vepř", "vepr")):
        return _preset_svickova(lower)

    # 2. Smažený sýr / smažák — PŘED bramboračkou!
    if "smaž" in lower or "eidam" in lower:
        return _preset_smazeny_syr()

    # 3. Kuře na paprice (specifický dvouslovný match)
    if "kuře" in lower and "papri" in lower:
        return _preset_kure_na_paprice()

    # 4. Bramboračka (generický „brambor" match, pokud nejde o smažený sýr)
    if ("brambor" in lower or "bramboračk" in lower) and not any(kw in lower for kw in ("smaž", "sýr", "eidam")):
        return _preset_bramboracka(lower)

    # 5. Guláš (pouze pokud v názvu není jiný specifický protein jako jelen, krůta, kachna)
    if ("guláš" in lower or "gulas" in lower) and not any(kw in lower for kw in ("jelen", "zvěřin", "krůt", "kachn", "losos")):
        return _preset_gulas(lower)

    # 6. Kulajda
    if "kulajd" in lower:
        return _preset_kulajda()

    # 7. Smažený sýr — fallback pro klíčové slovo „sýr" (bez jiného kontextu)
    if "sýr" in lower or "syr" in lower:
        return _preset_smazeny_syr()

    return None


# ═══════════════════════════════════════════════════════════════════════════
# INTELIGENTNÍ KULINÁŘSKÝ FALLBACK
# Generuje realistické ingredience pro neznámá jídla na základě klíčových slov.
# ═══════════════════════════════════════════════════════════════════════════

def generate_culinary_fallback(variation_name: str, variation_description: str) -> dict:
    """
    Inteligentní fallback — garantuje autentické české ingredience i bez LLM.

    Analyzuje název jídla a detekuje přesný typ proteinu:
    hlíva/houby, tofu/tempeh, krůtí, kachní, zvěřina/jelen, kuřecí, hovězí, ryba, vepřové.
    Sestaví detailní recept s 8 reálnými položkami z českých supermarketů.
    """
    combined = (variation_name + " " + variation_description).lower()

    # Nejdříve zkusíme přesný preset (pouze pro základní tradiční jídla)
    preset = get_dish_presets(combined)
    if preset:
        return preset

    # Detekce typu proteinu
    is_vegan = "vegan" in combined or "rostlinn" in combined or "bez masa" in combined
    is_tofu = "tofu" in combined or "tempeh" in combined

    protein_configs = {
        "mushroom":("Hlíva ústřičná nebo lesní houby",        450, "g", 180, 15, 3, 20, [9]),
        "tofu":    ("Tofu bílé přírodní nebo marinované",     350, "g", 360, 42, 18, 4, [6, 9]),
        "turkey":  ("Krůtí prsní řízky",                      500, "g", 540, 68, 10, 0, [9]),
        "duck":    ("Kachní prsa nebo čtvrtky",               500, "g", 720, 48, 40, 0, [9]),
        "game":    ("Zvěřina (jelení nebo kančí kýta)",       500, "g", 620, 65, 18, 0, [9]),
        "chicken": ("Kuřecí prsní nebo stehenní řízky",       500, "g", 550, 65, 12, 0, [9]),
        "beef":    ("Hovězí zadní nebo kližka",               500, "g", 650, 60, 25, 0, [9]),
        "fish":    ("Čerstvý filet z lososa",                 400, "g", 580, 52, 28, 0, [4]),
        "pork":    ("Vepřová plec nebo kýta",                 500, "g", 620, 55, 24, 0, [9]),
        "default": ("Mleté maso mix hovězí a vepřové",        400, "g", 480, 45, 28, 2, [1, 9]),
    }

    # Přesný výběr proteinu podle klíčových slov v názvu a popisu
    if any(kw in combined for kw in ("hlív", "hliva", "houb", "žampion", "zampion")):
        key = "mushroom"
    elif is_tofu or ("tofu" in combined) or ("tempeh" in combined):
        key = "tofu"
    elif any(kw in combined for kw in ("krůt", "krut")):
        key = "turkey"
    elif any(kw in combined for kw in ("kachn", "kachní")):
        key = "duck"
    elif any(kw in combined for kw in ("jelen", "zvěřin", "zverin", "kanč", "kanci", "srnč")):
        key = "game"
    elif any(kw in combined for kw in ("kuřec", "kure", "drůbež")):
        key = "chicken"
    elif any(kw in combined for kw in ("ryb", "losos", "pstruh", "candát")):
        key = "fish"
    elif any(kw in combined for kw in ("vepř", "vepr")):
        key = "pork"
    elif any(kw in combined for kw in ("hověz", "hovez")):
        key = "beef"
    elif is_vegan:
        key = "mushroom"
    else:
        key = "default"

    name, amount, unit, kcal, prot, fat, carbs, allergens = protein_configs[key]

    return {
        "ingredients": [
            {"name": name, "amount": amount, "unit": unit, "kcal": kcal, "protein": prot, "fat": fat, "carbs": carbs},
            {"name": "Cibule žlutá kuchyňská", "amount": 2, "unit": "ks", "kcal": 70, "protein": 2, "fat": 0.2, "carbs": 15},
            {"name": "Česnek paličák český", "amount": 3, "unit": "stroužky", "kcal": 15, "protein": 0.8, "fat": 0.1, "carbs": 3},
            {"name": "Kořenová zelenina (mrkev, celer, petržel)", "amount": 300, "unit": "g", "kcal": 95, "protein": 3, "fat": 0.5, "carbs": 20},
            {"name": "Panenský řepkový olej" if is_vegan else "Čerstvé máslo 82%", "amount": 40, "unit": "g",
             "kcal": 298, "protein": 0.3, "fat": 33, "carbs": 0.3},
            {"name": "Ovesná smetana na zahuštění" if is_vegan else "Smetana ke šlehání 33%", "amount": 200, "unit": "ml",
             "kcal": 250 if is_vegan else 580, "protein": 3, "fat": 15 if is_vegan else 65, "carbs": 7},
            {"name": "Čerstvé bylinky (petrželka, libeček)", "amount": 1, "unit": "svazek", "kcal": 10, "protein": 1, "fat": 0.2, "carbs": 1.5},
            {"name": "Směs koření a drcený kmín", "amount": 1, "unit": "balení", "kcal": 15, "protein": 0.5, "fat": 0.4, "carbs": 2},
        ],
        "steps": [
            {"step_number": 1, "instruction": f"Suroviny na {variation_name} očistěte, cibuli a zeleninu nakrájejte a připravte hlavní surovinu ({name})."},
            {"step_number": 2, "instruction": "V hrnci rozehřejte tuk a základ pozvolna orestujte dozlatova."},
            {"step_number": 3, "instruction": f"Přidejte {name}, opečte a přidejte koření."},
            {"step_number": 4, "instruction": "Podlijte vývarem, stáhněte plamen a duste doměkka."},
            {"step_number": 5, "instruction": "Zjemněte smetanou, dochuťte bylinkami a podávejte teplé."},
        ],
        "allergens": allergens,
        "total_nutrition": {"kcal": 520, "protein": 32, "fat": 24, "carbs": 35},
    }


# ═══════════════════════════════════════════════════════════════════════════
# GEMINI API — generování variant receptu
# ═══════════════════════════════════════════════════════════════════════════

def _strip_markdown_codeblock(raw: str) -> str:
    """Odstraní ``` ```json ... ``` obalení z Gemini odpovědí."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
    return raw


def _build_variations_prompt(dish_name: str, preferences: Optional[dict]) -> str:
    """Sestaví prompt pro generování 3–4 variant receptu."""
    prefs_str = json.dumps(preferences, ensure_ascii=False) if preferences else "Žádná zvláštní omezení"
    return (
        f"Jsi profesionální šéfkuchař a nutriční specialista pro českou aplikaci 'VkusnoPaskuda!'.\n"
        f"Vytvoř 3-4 různorodé a lákavé varianty receptu pro jídlo: '{dish_name}'.\n"
        f"PŘÍSNÁ DIETNÍ OMEZENÍ A PREFERENCE UŽIVATELE: {prefs_str}.\n"
        f"Pokud uživatel požaduje veganské, vegetariánské, keto (nízkosacharidové / low-carb s vysokým obsahem bílkovin a zdravých tuků bez mouky, cukru a brambor), bezlepkové nebo bezlaktózové jídlo, "
        f"VŠECHNY varianty MUSÍ těmto požadavkům 100% odpovídat!\n"
        f"U každé varianty povinně identifikuj alergeny (1–14: 1=Lepek, 3=Vejce, 6=Sója, 7=Mléko, 9=Celer, 10=Hořčice…).\n"
        f"DŮLEŽITÉ: Veškerý výstup musí být v ČEŠTINĚ.\n"
        f"Vrať POUZE JSON pole objektů s klíči: name, description, prep_time, cook_time, kcal, protein, fat, carbs, "
        f"allergens, dietary_tags, image_prompt.\n"
    )


def _build_recipe_details_prompt(variation_name: str, variation_description: str) -> str:
    """Sestaví prompt pro generování detailního receptu (ingredience + kroky)."""
    return (
        f"Jsi profesionální český šéfkuchař. Vytvoř detailní a autentický recept v ČEŠTINĚ přesně pro tuto specifickou variantu jídla:\n"
        f"Název varianty: '{variation_name}'\n"
        f"Popis: '{variation_description}'\n\n"
        f"KRITICKÁ PRAVIDLA PRO SUROVINY:\n"
        f"1. Suroviny MUSÍ 100% odpovídat názvu a popisu této konkrétní varianty! "
        f"PŘÍKLAD: Pokud je varianta 'z hlívy ústřičné' nebo houbová, HLAVNÍ SUROVINA MUSÍ BÝT 'Hlíva ústřičná' nebo lesní houby, NIKOLIV hovězí maso! "
        f"Pokud je varianta krůtí, musí obsahovat krůtí maso. Pokud je veganská či s tofu, musí obsahovat tofu/tempeh a rostlinné alternativy bez živočišných produktů.\n"
        f"2. Uveď 6 až 10 položek přesně tak, jak se běžně prodávají v českých supermarketech (Albert, Lidl, Tesco, Billa).\n"
        f"3. U každé položky uveď reálnou gramáž a české jednotky (g, ml, ks, lžíce, lžička) a nutriční hodnoty (kcal, protein, fat, carbs).\n"
        f"4. Kroky vaření (steps) musí detailně popisovat přípravu PRÁVĚ TÉTO VARIANTY.\n"
        f"5. Vrať POUZE validní JSON objekt:\n"
        f'{{\n'
        f'  "ingredients": [\n'
        f'    {{"name": "přesný český název", "amount": 100, "unit": "g", "kcal": 150, "protein": 12, "fat": 5, "carbs": 10}}\n'
        f'  ],\n'
        f'  "steps": [\n'
        f'    {{"step_number": 1, "instruction": "podrobný popis kroku"}}\n'
        f'  ],\n'
        f'  "allergens": [1, 7],\n'
        f'  "total_nutrition": {{"kcal": 550, "protein": 35, "fat": 20, "carbs": 45}}\n'
        f'}}\n'
    )


async def generate_dish_variations(dish_name: str, preferences: Optional[dict] = None) -> list[dict]:
    """
    Generuje 3–4 varianty receptu v češtině.

    Pokus 1: Zavolá Gemini API s kaskádovým fallbackem modelů.
    Pokus 2: Vrátí statické offline varianty odvozené z presetů.
    """
    client = get_gemini_client()
    prompt = _build_variations_prompt(dish_name, preferences)

    # Pokus o generování přes Gemini
    if client:
        for model_name in AVAILABLE_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                        http_options={"timeout": 15000},
                    ),
                )
                if response and response.text:
                    cleaned_text = _strip_markdown_codeblock(response.text)
                    try:
                        data = json.loads(cleaned_text)
                    except json.JSONDecodeError:
                        continue
                    if isinstance(data, str):
                        try:
                            data = json.loads(data)
                        except json.JSONDecodeError:
                            continue
                    if isinstance(data, list) and len(data) > 0:
                        return data
                    if isinstance(data, dict) and "variations" in data and isinstance(data["variations"], list):
                        return data["variations"]
            except Exception as err:
                logger.warning("Model %s selhalo pro varianty: %s — zkouším další…", model_name, err)

    # Offline fallback varianty
    dish_title = dish_name.strip().capitalize()
    preset = get_dish_presets(dish_name)

    variations = [
        {
            "name": f"Tradiční poctivá {dish_title}",
            "description": f"Autentická česká klasika {dish_title} z čerstvých ingrediencí.",
            "prep_time": 25, "cook_time": 50,
            "kcal": preset["total_nutrition"]["kcal"] if preset else 550,
            "protein": preset["total_nutrition"]["protein"] if preset else 32,
            "fat": preset["total_nutrition"]["fat"] if preset else 22,
            "carbs": preset["total_nutrition"]["carbs"] if preset else 48,
            "allergens": preset["allergens"] if preset else [1, 7, 9],
            "dietary_tags": ["tradiční"],
            "image_prompt": f"Traditional Czech {dish_name}, food photography",
        },
        {
            "name": f"Bezlepková {dish_title} (Gluten-Free)",
            "description": f"Varianta {dish_title} zahuštěná rýžovou moukou pro celiaky.",
            "prep_time": 20, "cook_time": 40,
            "kcal": 440, "protein": 28, "fat": 16, "carbs": 42,
            "allergens": [7, 9], "dietary_tags": ["bez-lepku"],
            "image_prompt": f"Gluten-free {dish_name}, modern plating",
        },
        {
            "name": f"Veganská {dish_title} s marinovaným tofu",
            "description": f"100% rostlinná verze {dish_title} s tofu a ovesnou smetanou.",
            "prep_time": 15, "cook_time": 30,
            "kcal": 380, "protein": 34, "fat": 14, "carbs": 32,
            "allergens": [6, 9], "dietary_tags": ["vegan", "bez-laktozy"],
            "image_prompt": f"Vegan plant-based {dish_name} with tofu",
        },
        {
            "name": f"Nízkokalorická fit {dish_title}",
            "description": f"Odlehčená fitness verze {dish_title} se zvýšeným podílem bílkovin.",
            "prep_time": 20, "cook_time": 35,
            "kcal": 360, "protein": 40, "fat": 9, "carbs": 28,
            "allergens": [9], "dietary_tags": ["nízkokalorické", "fitness"],
            "image_prompt": f"Healthy low-calorie {dish_name}, vibrant colors",
        },
    ]

    if preferences and preferences.get("is_keto"):
        keto_var = {
            "name": f"Keto {dish_title} (Low-Carb & High-Fat)",
            "description": f"Poctivá nízkosacharidová {dish_title} bez mouky a brambor se zdravými tuky a zeleninou.",
            "prep_time": 20, "cook_time": 35,
            "kcal": 520, "protein": 46, "fat": 36, "carbs": 6,
            "allergens": [7, 9], "dietary_tags": ["keto", "low-carb", "bez-lepku"],
            "image_prompt": f"Keto low-carb {dish_name} with rich sauce and fresh herbs",
        }
        variations.insert(0, keto_var)

    return variations


# ═══════════════════════════════════════════════════════════════════════════
# GEMINI API — generování detailů receptu (ingredience + kroky)
# ═══════════════════════════════════════════════════════════════════════════

# Blacklist slov — pokud je jakýkoliv ingredient obsahuje, recept je odmítnut jako stub
_STUB_INDICATORS = ("čerstvé suroviny na", "hlavní surovina pro")


async def generate_recipe_details(variation_name: str, variation_description: str) -> dict:
    """
    Generuje detailní recept: ingredience, kroky vaření, alergeny, KBŽU.

    Pokus 1: Gemini API → parsování JSON → validace (min. 3 ingredience, žádné stuby).
    Pokus 2: Kulinarní fallback generate_culinary_fallback().
    """
    client = get_gemini_client()

    if client:
        prompt = _build_recipe_details_prompt(variation_name, variation_description)
        for model_name in AVAILABLE_MODELS:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                        http_options={"timeout": 15000},
                    ),
                )
                if response and response.text:
                    cleaned_text = _strip_markdown_codeblock(response.text)
                    try:
                        data = json.loads(cleaned_text)
                    except json.JSONDecodeError:
                        continue
                    if isinstance(data, str):
                        try:
                            data = json.loads(data)
                        except json.JSONDecodeError:
                            continue
                    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
                        data = data[0]
                    if isinstance(data, dict):
                        ingredients = data.get("ingredients", [])
                        # Validace: min. 3 položky a žádné stuby
                        has_stubs = any(
                            any(stub in str(i.get("name", "")).lower() for stub in _STUB_INDICATORS)
                            for i in ingredients
                        )
                        if len(ingredients) >= 3 and not has_stubs:
                            return data
            except Exception as err:
                logger.warning("Model %s selhalo pro detaily receptu: %s — zkouším další…", model_name, err)

    # Fallback → kulinářský generátor
    return generate_culinary_fallback(variation_name, variation_description)


# ═══════════════════════════════════════════════════════════════════════════
# GEMINI API — překlad / normalizace názvů surovin
# ═══════════════════════════════════════════════════════════════════════════

async def translate_ingredient_to_czech(ingredient_name: str) -> str:
    """Přeloží/normalizuje název suroviny na standardní český název v supermarketu."""
    client = get_gemini_client()
    if not client:
        return ingredient_name

    prompt = (
        f"Převeď/normalizuj název suroviny '{ingredient_name}' na standardní český "
        f"název zboží v supermarketu. Vrať POUZE název bez dalších slov nebo uvozovek."
    )
    try:
        response = client.models.generate_content(
            model=AVAILABLE_MODELS[0],
            contents=prompt,
            config=types.GenerateContentConfig(
                automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
                http_options={"timeout": 10000},
            ),
        )
        return response.text.strip()
    except Exception:
        return ingredient_name
