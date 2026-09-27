"""
matcher_service.py — Inteligentní matcher surovin z receptů s reálnými produkty v obchodech.

Používá:
  1. Textovou normalizaci (odstranění české diakritiky, jednotek, gramáží a marketingových slov).
  2. Slovník kulinářských synonym a ekvivalentů (čeština).
  3. Fuzzy matching přes RapidFuzz (token_set_ratio + WRatio + penalizace neslučitelných kategorií).
  4. Výpočet normalizovaného confidence score (0.0 až 1.0) pro ProductIngredient.match_score.
"""
import re
import unicodedata
from typing import List, Dict, Any, Tuple, Optional
from rapidfuzz import fuzz, process

# Seznam kulinářských a balicích stop-slov k odstranění
STOP_WORDS = {
    "cerstvy", "cerstva", "cerstve", "kvalitni", "vyberovy", "vyberova", "vyberove",
    "jemny", "jemna", "jemne", "extra", "tradicni", "domaci", "bio", "eko",
    "kuchynsky", "kuchynska", "kuchynske", "chlazeny", "chlazena", "chlazene",
    "mrazeny", "mrazena", "mrazene", "suseny", "susena", "susene", "vareny",
    "varena", "varene", "peceny", "pecena", "pecene", "baleni", "pytlik", "svazek",
    "vanicka", "kelimek", "sacek", "lahev", "plechovka", "kus", "kusu", "kusy",
    "platky", "kostky", "nudlicky", "strouhany", "strouhana", "strouhane", "cely",
    "cela", "cele", "drceny", "drcena", "drcene", "mlety", "mleta", "mlete",
    "prirodni", "uzeny", "uzena", "uzene", "lahudkovy", "lahudkova"
}

# Kořenové mapování kulinářských synonym pro český maloobchod
SYNONYM_GROUPS = [
    ({"maslo", "masla", "maslem"}, "maslo"),
    ({"brambor", "brambory", "brambora", "bramborak", "bramborovy"}, "brambor"),
    ({"hovezi", "klizka", "svickova", "rostenec", "plec"}, "hovezi"),
    ({"kure", "kureci", "kurete", "kridla", "stehna", "prsa"}, "kure"),
    ({"veprove", "veprovka", "sadlo", "krkovice", "kotleta", "pecene"}, "veprove"),
    ({"smetana", "smetanky", "smetanou", "slehacka"}, "smetana"),
    ({"mleko", "mleka", "mlekem"}, "mleko"),
    ({"vejce", "vajicko", "vajicka", "vajec"}, "vejce"),
    ({"mouka", "mouky", "moukou"}, "mouka"),
    ({"cibule", "cibulkou", "cibulka", "salotka"}, "cibule"),
    ({"cesnek", "cesneku", "cesnekem"}, "cesnek"),
    ({"eidam", "gouda", "syr", "syrecky", "hermelin", "camembert"}, "syr"),
    ({"klobasa", "parek", "parky", "spekacek", "spekacky", "slanina", "spek"}, "uzenina"),
    ({"hliva", "zampion", "zampiony", "houby", "hriby"}, "houby"),
    ({"tofu", "tempeh", "seitan", "robi"}, "rostlinny_protein"),
    ({"divocak", "zverina", "srnci", "kanci", "jelen"}, "zverina"),
    ({"mrkev", "celer", "petrzel", "korenova zelenina"}, "korenova_zelenina"),
    ({"olej", "olivovy olej", "repkovy olej", "slunecnicovy olej"}, "olej"),
    ({"protlak", "pyre", "rajcata", "rajcatovy"}, "rajcata"),
    ({"tatarka", "tatarska omacka", "majoneza"}, "tatarka"),
    ({"horcice", "plnotucna", "kremzska"}, "horcice"),
    ({"losos", "pstruh", "ryba", "treska", "kapr"}, "ryba"),
    ({"kmin", "majoranka", "bobkovy list", "nove koreni", "pepr", "sul"}, "koreni"),
    ({"cukr", "mouckovy", "krystal", "krupice"}, "cukr"),
    ({"ryze", "jasminova", "basmati", "parboiled"}, "ryze"),
    ({"testoviny", "spagety", "kolinka", "penne"}, "testoviny"),
]

# Kategorie pro detekci neslučitelných surovin
PROTEIN_CATEGORIES = {
    "hovezi", "kure", "veprove", "ryba", "rostlinny_protein", "uzenina", "zverina"
}
DAIRY_CATEGORIES = {
    "smetana", "mleko", "syr", "maslo"
}


def strip_accents(text: str) -> str:
    """Odstraní českou diakritiku (např. 'máslo' -> 'maslo')."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c))


def normalize_ingredient_text(text: str) -> str:
    """
    Normalizuje název ingredience nebo produktu pro robustní fuzzy porovnání.
    1. Převod na malá písmena a odstranění diakritiky.
    2. Odstranění závorek a doplňujících poznámek v závorce.
    3. Odstranění číselných mír a jednotek (např. '250g', '1 kg', '33%', '10ks').
    4. Odstranění nepodstatných stop-slov.
    """
    if not text:
        return ""

    # Malá písmena + odstranění diakritiky
    clean = strip_accents(text.lower())

    # Odstranění obsahu závorek
    clean = re.sub(r"\(.*?\)", " ", clean)

    # Odstranění procent
    clean = re.sub(r"\d+\s*%", " ", clean)

    # Odstranění jednotek s čísly (250g, 1kg, 2 ks, 500 ml atd.)
    clean = re.sub(
        r"\b\d+([\.,]\d+)?\s*(g|kg|dkg|ml|l|dl|cl|ks|kusu|kusy|lzice|lzicka|baleni|proc)\b",
        " ",
        clean,
    )

    # Odstranění samostatných čísel a interpunkce kromě písmen
    clean = re.sub(r"[^\w\s]", " ", clean)
    clean = re.sub(r"\b\d+\b", " ", clean)

    # Rozdělení na slova a filtrace stop-slov
    tokens = clean.split()
    filtered = [w for w in tokens if w not in STOP_WORDS and len(w) > 1]

    return " ".join(filtered) if filtered else clean.strip()


def get_canonical_group(normalized_text: str) -> Optional[str]:
    """Určí kanonickou skupinu ingredience podle slovníku synonym."""
    tokens = set(normalized_text.split())
    for syn_set, group_name in SYNONYM_GROUPS:
        if tokens & syn_set:
            return group_name
        for t in tokens:
            if any(t.startswith(s) or s.startswith(t) for s in syn_set if len(s) >= 4):
                return group_name
    return None


class IntelligentMatcher:
    """
    Fuzzy Matcher s využitím RapidFuzz a kulinářské doménové logiky.
    """

    @staticmethod
    def calculate_match_score(ingredient_name: str, product_name: str) -> float:
        """
        Vypočítá míru shody mezi surovinou z receptu a názvem produktu v obchodě (0.0 až 1.0).
        """
        norm_ing = normalize_ingredient_text(ingredient_name)
        norm_prod = normalize_ingredient_text(product_name)

        if not norm_ing or not norm_prod:
            return 0.0

        # Přímá textová shoda
        if norm_ing == norm_prod:
            return 1.0

        # Zjištění kanonických skupin
        group_ing = get_canonical_group(norm_ing)
        group_prod = get_canonical_group(norm_prod)

        # Kontrola neslučitelných kategorií proteinů a živočišných vs rostlinných alternativ
        if group_ing and group_prod:
            if group_ing in PROTEIN_CATEGORIES and group_prod in PROTEIN_CATEGORIES and group_ing != group_prod:
                return 0.0
            if (group_ing == "rostlinny_protein" and group_prod in DAIRY_CATEGORIES) or \
               (group_ing in DAIRY_CATEGORIES and group_prod == "rostlinny_protein"):
                return 0.0

        # Vícekriteriální skóre z RapidFuzz
        # 1. token_set_ratio: excelentní pro podmnožiny slov (např. 'máslo' v 'jihočeské máslo madeta')
        score_set = fuzz.token_set_ratio(norm_ing, norm_prod)

        # 2. partial_ratio: hledá nejlepší shodu podřetězce
        score_partial = fuzz.partial_ratio(norm_ing, norm_prod)

        # 3. WRatio: vážený poměr zohledňující délky a pořadí
        score_wratio = fuzz.WRatio(norm_ing, norm_prod)

        # Kombinované základní skóre (0 - 100)
        base_score = 0.50 * score_set + 0.30 * score_partial + 0.20 * score_wratio

        # Bonus za shodu kanonické skupiny (+15 %)
        if group_ing and group_prod and group_ing == group_prod:
            base_score = min(100.0, base_score + 15.0)

        # Bonus pokud první slovo ingredience (často to nejdůležitější) je v produktu
        ing_words = norm_ing.split()
        if ing_words:
            first_word = ing_words[0]
            if first_word in norm_prod:
                base_score = min(100.0, base_score + 10.0)

        # Převod na škálu 0.0000 až 1.0000
        return round(max(0.0, min(1.0, base_score / 100.0)), 4)

    @classmethod
    def match_ingredient_to_products(
        cls,
        ingredient_name: str,
        products: List[Any],
        min_score: float = 0.50,
        limit: int = 10,
    ) -> List[Tuple[Any, float]]:
        """
        Najde v seznamu produktů nejlépe odpovídající položky pro zadanou surovinu.
        Vrací seznam dvojic (produkt, skóre) seřazený sestupně podle skóre.
        """
        scored_items = []
        for p in products:
            prod_name = p.name if hasattr(p, "name") else (p.get("name", "") if isinstance(p, dict) else str(p))
            score = cls.calculate_match_score(ingredient_name, prod_name)
            if score >= min_score:
                scored_items.append((p, score))

        scored_items.sort(key=lambda x: x[1], reverse=True)
        return scored_items[:limit]
