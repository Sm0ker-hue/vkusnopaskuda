import re
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from ..base_scraper import BaseScraper
from ..normalizer import Normalizer

class AkcniCenyScraper(BaseScraper):
    def __init__(self, query: str = "máslo"):
        super().__init__("AkcniCeny.cz")
        self.base_url = "https://www.akcniceny.cz"
        self.query = query

    async def fetch_data(self) -> Any:
        url = f"{self.base_url}/hledej/?s={self.query}"
        response = await self.client.get(url)
        return response.text

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(raw_data, 'html.parser')
        products = []

        # Parse rounded-16 product cards
        for box in soup.find_all("div", class_=re.compile(r"rounded-16")):
            title_a = box.find("a", href=re.compile(r"/akce/"))
            if not title_a:
                continue

            product_name = title_a.get("title") or title_a.get_text(strip=True)
            if not product_name or len(product_name) < 3:
                continue

            product_url = title_a.get("href", "")
            if product_url and not product_url.startswith("http"):
                product_url = f"{self.base_url}{product_url}"

            sub_rows = box.find_all("div", class_=re.compile(r"col-md-6|row"))
            for sub in sub_rows:
                sub_text = " ".join(sub.stripped_strings)
                if "Kč" not in sub_text:
                    continue

                for known_store in [
                    "Albert", "Billa", "Lidl", "Kaufland", "Tesco",
                    "Penny Market", "Penny", "Globus", "Coop", "Norma"
                ]:
                    if re.search(rf"\b{known_store}\b", sub_text, re.I):
                        prices = re.findall(r"(\d+[\d\s]*[,.]\d{2})\s*Kč", sub_text)
                        if prices:
                            clean_price = Normalizer.normalize_price(prices[0])
                            products.append({
                                "name": product_name,
                                "discount_price": clean_price,
                                "original_price": clean_price,
                                "store": known_store,
                                "url": product_url
                            })

        return products
