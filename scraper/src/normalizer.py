import re
import unicodedata
from typing import Dict, Any

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

class Normalizer:
    """Normalizes product and ingredient data from various supermarkets."""
    
    @staticmethod
    def strip_accents(text: str) -> str:
        """Strip Czech accents (e.g. 'máslo' -> 'maslo')."""
        if not text:
            return ""
        nfkd = unicodedata.normalize("NFKD", text)
        return "".join(c for c in nfkd if not unicodedata.combining(c))

    @staticmethod
    def normalize_price(price_str: Any) -> float:
        """Convert price string/number to float."""
        if price_str is None or price_str == "":
            return 0.0
        if isinstance(price_str, (int, float)):
            return float(price_str)
        # Remove currency symbols and non-breaking spaces
        cleaned = re.sub(r'[^\d.,]', '', str(price_str))
        # Handle decimal commas
        cleaned = cleaned.replace(',', '.')
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    @staticmethod
    def normalize_ingredient_name(name: str) -> str:
        """Strip weights, units, percentages, and noise words for accurate matching."""
        if not name:
            return ""
        clean = Normalizer.strip_accents(name.lower())
        clean = re.sub(r"\(.*?\)", " ", clean)
        clean = re.sub(r"\d+\s*%", " ", clean)
        clean = re.sub(
            r"\b\d+([\.,]\d+)?\s*(g|kg|dkg|ml|l|dl|cl|ks|kusu|kusy|lzice|lzicka|baleni)\b",
            " ",
            clean,
        )
        clean = re.sub(r"[^\w\s]", " ", clean)
        clean = re.sub(r"\b\d+\b", " ", clean)
        tokens = clean.split()
        filtered = [w for w in tokens if w not in STOP_WORDS and len(w) > 1]
        return " ".join(filtered) if filtered else clean.strip()

    @staticmethod
    def normalize_product(product: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize a single product dictionary."""
        return {
            "name": str(product.get("name", "")).strip(),
            "original_price": Normalizer.normalize_price(product.get("original_price", "")),
            "discount_price": Normalizer.normalize_price(product.get("discount_price", "")),
            "discount_percentage": product.get("discount_percentage", 0),
            "unit": str(product.get("unit", "")).strip().lower(),
            "store": product.get("store", "unknown"),
            "url": product.get("url", ""),
            "image_url": product.get("image_url", ""),
            "normalized_name": Normalizer.normalize_ingredient_name(product.get("name", ""))
        }
