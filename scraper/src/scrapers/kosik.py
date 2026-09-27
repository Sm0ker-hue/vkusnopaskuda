from typing import Dict, Any, List
from ..base_scraper import BaseScraper

class KosikScraper(BaseScraper):
    def __init__(self):
        super().__init__("Košík")
        self.api_url = "https://www.kosik.cz/api/front/products" # Example endpoint

    async def fetch_data(self) -> Any:
        # Example using Kosik's GraphQL or internal API
        try:
            response = await self.client.get("https://www.kosik.cz/api/front/products/discounts")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"Failed to fetch Kosik API: {e}")
            return {"products": []}

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        parsed_products = []
        for item in raw_data.get("products", []):
            parsed_products.append({
                "name": item.get("name"),
                "original_price": item.get("priceOriginal"),
                "discount_price": item.get("price"),
                "store": "Košík"
            })
        return parsed_products
