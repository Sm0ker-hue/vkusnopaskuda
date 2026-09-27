from abc import ABC, abstractmethod
from typing import Dict, Any, List
import httpx
import asyncio

class BaseScraper(ABC):
    """Abstract base class for all supermarket scrapers."""
    
    def __init__(self, name: str):
        self.name = name
        # Setup HTTP client with basic browser headers
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
        self.client = httpx.AsyncClient(headers=self.headers, timeout=15.0)

    @abstractmethod
    async def fetch_data(self) -> Any:
        """Fetch raw data from the supermarket's source (API or HTML)."""
        pass

    @abstractmethod
    def parse(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Parse raw data into structured but unnormalized format."""
        pass

    async def run(self) -> List[Dict[str, Any]]:
        """Main execution flow: fetch -> parse."""
        try:
            raw_data = await self.fetch_data()
            parsed_data = self.parse(raw_data)
            return parsed_data
        except Exception as e:
            print(f"[{self.name}] Error during scraping: {e}")
            return []
        finally:
            await self.client.aclose()
