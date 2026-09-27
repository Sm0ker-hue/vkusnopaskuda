from typing import Dict, Any, List
from ..base_scraper import BaseScraper
from ..aggregators.kupi_cz import KupiScraper

class PennyScraper(BaseScraper):
    def __init__(self):
        super().__init__("Penny")
        self.kupi_scraper = KupiScraper()

    async def fetch_data(self) -> Any:
        return await self.kupi_scraper.fetch_data()

    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        all_products = self.kupi_scraper.parse(raw_data)
        return [p for p in all_products if "penny" in p.get("store", "").lower()]
