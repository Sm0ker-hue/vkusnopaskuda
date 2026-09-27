from typing import Dict, Any, List
from ..base_scraper import BaseScraper

class RohlikScraper(BaseScraper):
    def __init__(self):
        super().__init__("Rohlík")
        # Rohlík usually has a GraphQL or REST API for products
        self.api_url = "https://www.rohlik.cz/api/v1/products" # Example endpoint

    async def fetch_data(self) -> Any:
        # Example using Rohlik's internal API structure
        # Note: Actual API requires cookies and specific headers
        params = {
            "categoryId": "300101000", # Example category
            "limit": "50"
        }
        # In a real scenario, this endpoint varies. We use a placeholder that would be correct conceptually.
        try:
            response = await self.client.get("https://www.rohlik.cz/services/frontend-service/products", params=params)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to fetch Rohlik API: {e}")
            return {"data": []}

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        parsed_products = []
        product_list = raw_data.get("data", [])
        for item in product_list:
            parsed_products.append({
                "name": item.get("name"),
                "original_price": item.get("price", {}).get("full"),
                "discount_price": item.get("price", {}).get("current"),
                "store": "Rohlík"
            })
        return parsed_products
