from typing import Dict, Any, List
from ..base_scraper import BaseScraper
from ..aggregators.akcniceny_cz import AkcniCenyScraper

class BillaScraper(BaseScraper):
    def __init__(self):
        super().__init__("Billa")
        self.akcni_scraper = AkcniCenyScraper()

    async def fetch_data(self) -> Any:
        return await self.akcni_scraper.fetch_data()

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        all_products = self.akcni_scraper.parse(raw_data)
        return [p for p in all_products if "billa" in p.get("store", "").lower()]
