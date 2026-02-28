import asyncio
import json
import os
from dotenv import load_dotenv
from pydoc import html
import string
from typing import List
from crawl4ai import AsyncWebCrawler, CacheMode, CrawlResult, RateLimiter 
from crawl4ai import CrawlerRunConfig, DefaultMarkdownGenerator
from crawl4ai import LLMExtractionStrategy, PruningContentFilter, LLMConfig, MemoryAdaptiveDispatcher
import sqlite3

from supabase import create_client



async def get_link(tar_urls: List[str], pattern: str):
    print("link extraction")

    crawl_config = CrawlerRunConfig(
    wait_for_timeout=10, # Increase if on a slow network
    cache_mode=CacheMode.BYPASS,
    simulate_user=True, # Simulates mouse movements, scrolls
    delay_before_return_html=2, # Seconds
    )

    dispatcher = MemoryAdaptiveDispatcher(
        memory_threshold_percent=70.0,  # Pause if memory >70%
        max_session_permit=5,           # Only 3 concurrent requests
        rate_limiter=RateLimiter(
            base_delay=(1.5, 3.0),      # Random delay 1.5–3.0s between requests
            max_delay=30.0,             # Cap exponential backoff
            max_retries=2,              # Retry twice on failure
            rate_limit_codes=[429, 503, 504]  # Common rate limit codes
        )
    )

    async with AsyncWebCrawler() as crawler:
        results: List[CrawlResult] = await crawler.arun_many(
            urls=tar_urls,
            config=crawl_config,
            dispatcher=dispatcher,
        )

        for i, result in enumerate(results):
            internal_links = result.links.get("internal", [])
            print(f"found {len(internal_links)} internal links")

            filtered_links = []

            for links in internal_links:
                if pattern in links["href"]:
                    filtered_links.append(links["href"])
                    # print(links["href"])

            print(f"filtered links count: {len(filtered_links)}")

            sql_save(filtered_links)



def sql_save(links: List[str]):
    
    for url in links:
        
        response = (
            supabase
            .table("scraped_link")
            .upsert({"url": url}, on_conflict="url")
            .execute()
        )
        
        print(response)

    
if __name__ == "__main__":
    SUPABASE_URL = os.getenv("DB_URL")
    SUPABASE_KEY = os.getenv("API_KEY")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    url = "https://www.malaysiakini.com/en/tag/crime?page=0"
    urls = []
    for i in range(0, 1):
        urls.append(f"https://www.malaysiakini.com/en/tag/crime?page={i}")

    pattern = "/news/"
    asyncio.run(get_link(urls, pattern))