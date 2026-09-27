import re
import json
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from ..base_scraper import BaseScraper
from ..normalizer import Normalizer

class KupiScraper(BaseScraper):
    def __init__(self, query: str = "máslo"):
        super().__init__("Kupi.cz")
        self.base_url = "https://www.kupi.cz"
        self.query = query

    async def fetch_data(self) -> Any:
        url = f"{self.base_url}/hledej?f={self.query}&vse=0"
        response = await self.client.get(url)
        return response.text

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(raw_data, 'html.parser')
        products = []

        # Find schema.org ld+json scripts if present
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                data = json.loads(script.string or "")
                if data.get("@type") == "Product" and "offers" in data:
                    name = data.get("name", "").strip()
                    offers = data["offers"].get("offers", [])
                    for off in offers:
                        store_name = off.get("offeredBy", "Unknown")
                        price = float(off.get("price", 0.0))
                        if price > 0:
                            products.append({
                                "name": name,
                                "discount_price": price,
                                "original_price": price,
                                "store": store_name,
                                "url": f"{self.base_url}{data.get('url', '')}"
                            })
            except Exception:
                continue

        # If ld+json not on search page, parse product link cards
        if not products:
            for item in soup.find_all("div", class_=re.compile(r"product|item|discount", re.I)):
                name_el = item.find(class_=re.compile(r"name|title", re.I))
                price_el = item.find(class_=re.compile(r"price|cena", re.I))
                store_el = item.find(class_=re.compile(r"shop|store|logo", re.I))
                if name_el and price_el:
                    products.append({
                        "name": name_el.get_text(strip=True),
                        "discount_price": Normalizer.normalize_price(price_el.get_text(strip=True)),
                        "original_price": Normalizer.normalize_price(price_el.get_text(strip=True)),
                        "store": store_el.get_text(strip=True) if store_el else "Unknown",
                        "url": self.base_url
                    })

        return products
