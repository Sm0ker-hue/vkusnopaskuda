from rapidfuzz import fuzz, process
from typing import List, Dict, Any, Tuple
from .normalizer import Normalizer

class IngredientMatcher:
    """Matches ingredients from recipes to actual supermarket products using RapidFuzz."""
    
    def __init__(self, products: List[Dict[str, Any]]):
        self.products = products
        self.normalized_product_names = [
            Normalizer.normalize_ingredient_name(p.get("name", "")) for p in self.products
        ]

    def match_ingredient(self, ingredient: str, limit: int = 5, score_cutoff: float = 50.0) -> List[Tuple[Dict[str, Any], float]]:
        """
        Match a single ingredient against the product database.
        Returns top matches with their confidence score (0.0 - 1.0).
        """
        norm_ingredient = Normalizer.normalize_ingredient_name(ingredient)
        if not norm_ingredient or not self.normalized_product_names:
            return []

        # Token set ratio + WRatio
        matches = process.extract(
            norm_ingredient, 
            self.normalized_product_names, 
            scorer=fuzz.token_set_ratio, 
            limit=limit,
            score_cutoff=score_cutoff
        )
        
        result = []
        for match_str, score, index in matches:
            # Combine with WRatio for fine-grained ranking
            w_score = fuzz.WRatio(norm_ingredient, match_str)
            final_score = round(max(score, w_score) / 100.0, 4)
            result.append((self.products[index], final_score))
            
        result.sort(key=lambda x: x[1], reverse=True)
        return result
