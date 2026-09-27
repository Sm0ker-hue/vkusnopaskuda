import asyncio
import logging
import json
from datetime import datetime
from src.aggregators.kupi_cz import KupiScraper
from src.aggregators.akcniceny_cz import AkcniCenyScraper
from src.matcher import IngredientMatcher
from src.normalizer import Normalizer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ScraperScheduler")

STAPLE_QUERIES = [
    "máslo", "brambory", "mléko", "kuře", "hovězí", "vejce", "sýr", 
    "mouka", "cibule", "česnek", "smetana", "olej"
]

async def run_all_scrapers():
    logger.info("=== Starting scraping cycle for Plzeň & Czech supermarkets ===")
    all_products = []

    for query in STAPLE_QUERIES:
        # 1. Kupi.cz
        try:
            kupi = KupiScraper(query=query)
            kupi_data = await kupi.run()
            logger.info(f"[Kupi.cz] '{query}': {len(kupi_data)} items")
            for item in kupi_data:
                norm = Normalizer.normalize_product(item)
                all_products.append(norm)
        except Exception as e:
            logger.error(f"Error running KupiScraper for '{query}': {e}")

        # 2. AkcniCeny.cz
        try:
            akcni = AkcniCenyScraper(query=query)
            akcni_data = await akcni.run()
            logger.info(f"[AkcniCeny.cz] '{query}': {len(akcni_data)} items")
            for item in akcni_data:
                norm = Normalizer.normalize_product(item)
                all_products.append(norm)
        except Exception as e:
            logger.error(f"Error running AkcniCenyScraper for '{query}': {e}")

    logger.info(f"Scraping cycle completed. Total products collected: {len(all_products)}")

    # Test fuzzy matcher
    if all_products:
        matcher = IngredientMatcher(all_products)
        test_matches = matcher.match_ingredient("brambory varný typ B", limit=3)
        logger.info(f"Fuzzy matching test for 'brambory varný typ B': {len(test_matches)} matches found.")
        for prod, score in test_matches:
            logger.info(f"  -> Match: {prod.get('name')} ({prod.get('store')}) | Score: {score}")

    return all_products

async def scheduler(interval_hours=6):
    interval_seconds = interval_hours * 3600
    while True:
        logger.info(f"Scheduler triggered at {datetime.now()}")
        await run_all_scrapers()
        logger.info(f"Sleeping for {interval_hours} hours...")
        await asyncio.sleep(interval_seconds)

if __name__ == "__main__":
    try:
        asyncio.run(scheduler())
    except KeyboardInterrupt:
        logger.info("Scheduler stopped manually.")
