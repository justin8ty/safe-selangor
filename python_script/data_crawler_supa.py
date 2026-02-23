import asyncio
import json
from pydoc import html
from typing import List
from crawl4ai import AsyncWebCrawler, CacheMode, CrawlResult, RateLimiter 
from crawl4ai import CrawlerRunConfig, DefaultMarkdownGenerator
from crawl4ai import LLMExtractionStrategy, PruningContentFilter, LLMConfig,MemoryAdaptiveDispatcher
import sqlite3
from supabase import create_client
from dotenv import load_dotenv
import os



async def markup_extractions(tar_urls: List[str]) -> List[str]:
    print("Starting markup extraction demo...")

    crawl_config = CrawlerRunConfig(
        wait_for_timeout=10, # Increase if on a slow network
        cache_mode=CacheMode.BYPASS,
        simulate_user=True, # Simulates mouse movements, scrolls
        delay_before_return_html=2, # Seconds
        markdown_generator=DefaultMarkdownGenerator(
                    content_filter=PruningContentFilter()
                ) 
    )

    dispatcher = MemoryAdaptiveDispatcher(
        memory_threshold_percent=70.0,  # Pause if memory >70%
        max_session_permit=4,           # Only 3 concurrent requests
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

        print(f"Total results: {len(results)}")

        all_markdown_parts = []

        for i, result in enumerate(results):
            print(f"Result {i + 1} :")
            print(f"Success: {result.success}")
            if result.success:
                all_markdown_parts.append(f"\n\n--- ARTICLE BREAK ---\n\n")
                all_markdown_parts.append(f"\n\n--- ARTICLE_LINK:{result.url} ---\n\n")
                all_markdown_parts.append(result.markdown.fit_markdown)
            else:
                print("Fail to crawl URL")
                
        combined_markdown = "".join(all_markdown_parts)

        with open("output/combined_outputfit.txt", "w") as file:
            file.write(combined_markdown)


def load_urls(db_path: str, limit :int) -> List[str]:
    count = 0
    rows = (
        supabase
        .table("scraped_link")
        .select("url")
        .order("id", desc=False)
        .limit(limit)
        .execute()
    )
    loaded_url = []

    for row in rows.data:
        print(row["url"])

    return

    for url in rows:
        if check_processed_url(db_path, url[0]):
            print(f"URL already processed: {url[0]}")
            continue
        loaded_url.append(url[0])
        print(f"Loaded URL: {url[0]}")
        count += 1
    print(f"Total new URLs loaded: {count}")


    if count == 0:
        print("No new URLs to process. Exiting.")
        with open('output/combined_outputfit.txt', 'w'): pass
        exit(0)
    return loaded_url

if __name__ == "__main__":
    SUPABASE_URL = os.getenv("DB_URL")
    SUPABASE_KEY = os.getenv("API_KEY")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    urls=load_urls('crime_data.db', 100)
    #asyncio.run(markup_extractions(urls))