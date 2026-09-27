from typing import Dict, Any, List
from bs4 import BeautifulSoup
from ..base_scraper import BaseScraper

class TescoScraper(BaseScraper):
    def __init__(self):
        super().__init__("Tesco")
        self.url = "https://nakup.itesco.cz/groceries/cs-CZ/promotions/all"

    async def fetch_data(self) -> Any:
        response = await self.client.get(self.url)
        return response.text

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(raw_data, 'html.parser')
        products = []
        for item in soup.select(".product-list--list-item"):
            title = item.select_one(".product-details--wrapper h3")
            price = item.select_one(".price-control-wrapper .value")
            
            if title and price:
                products.append({
                    "name": title.text.strip(),
                    "discount_price": price.text.strip(),
                    "store": "Tesco"
                })
        return products
