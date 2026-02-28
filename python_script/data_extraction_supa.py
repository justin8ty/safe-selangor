import asyncio
import json
from pydoc import html
from typing import List
from crawl4ai import AsyncWebCrawler, CacheMode, CrawlResult 
from crawl4ai import CrawlerRunConfig, DefaultMarkdownGenerator
from crawl4ai import LLMExtractionStrategy, PruningContentFilter, LLMConfig
from supabase import create_client
from dotenv import load_dotenv
import os
import sqlite3

async def data_extraction(raw_markdown: str):
    print("Starting LLM structured data extraction demo...")
    
    load_dotenv()
    LLM_KEY = os.getenv("LLM_API_KEY_1")

    extraction_strategy = LLMExtractionStrategy(
        llm_config= LLMConfig(
            provider="gemini/gemini-2.5-flash",
            api_token=LLM_KEY,
        ),
        
        chunk_token_threshold=1_000_000,
        apply_chunking = False,

        input_format="fit_markdown",

        instruction="""
        Analyze the following combined text, which contains multiple news articles separated by '--- ARTICLE BREAK ---'. 
        First identify the url that is given after '--- ARTICLE_LINK:'.
        Each article is a news article for malaysian news. if it is a news related to crime, extract the date(with time if present), crime type,malaysia's state, malaysia's district location, 
        victim's age and suspect's age. If there is no crime related information, return 0 for any missing info. Crime types include only violent, property and drugs .rape and sexual harrasment can be counted as violent.
        If crime is not related to violent, property or drugs return 0.
        """,
        extraction_type="schema",
        schema="{date: string, crime_type: string, state: string, district: string, victim_age: int, suspect_age: int,url: string}",
        extra_args={
            "temperature": 0.1,
            "max_tokens": 200000},
        verbose=True,
    )

    config = CrawlerRunConfig(
        extraction_strategy=extraction_strategy)

    async with AsyncWebCrawler() as crawler:
        results: List[CrawlResult] = await crawler.arun(
            url=f"raw://{raw_markdown}",
            config=config,
        )
        
        for result in results:
            print(f"URL: {result.url}")
            print(f"Success: {result.success}")
            if result.success:
                datas = json.loads(result.extracted_content)
                print(json.dumps(datas, indent=2))

                for data in datas:
                    print(data)
                    # if url_exist_in_db_result('crime_data.db', data["url"]):
                    #     print(f"URL already exists in Crawl_Result database: {data['url']}")
                    #     continue
                    process_link(data)
                    insert_Data(data)

            else:
                print("Failed to extract structured data")

def process_link(url):
    # Example processing: Extract the domain from the URL
    data = {
        "is_processed": True
    }
    (
            supabase
            .table("scraped_link")
            .update(data)
            .eq("url", url["url"])
            .execute()
    )

def insert_Data(data):
    
    districts = ["Brickfields", "Cheras", "Dang Wangi", 
                "Sentul", "W.P. Putrajaya","Wangsa Maju",
                "Ampang Jaya"  , "Gombak"     ,        "Kajang", 
                "Klang Selatan", "Klang Utara", "Petaling Jaya",
                "Sepang"      , "Serdang"    ,     "Shah Alam", 
                "Subang Jaya"]
    
    print(data)

    data["crime_type"] = data["crime_type"].lower()

    values = {
            "state": data["state"],
            "district": data["district"],
            "type": data["crime_type"],
            "date": data["date"],
            "victim_age": int(data["victim_age"]),
            "suspect_age": int(data["suspect_age"]),
            "url": data["url"],
        }
    
    if data["district"] not in districts:
        print(f"District {data['district']} not in predefined list, skipping insertion.")
        return
    
    if data["crime_type"] not in ["violent", "property", "drugs"]:
        print(f"Crime type {data['crime_type']} not in predefined list, skipping insertion.")
        return
    
    if data["crime_type"] == "drugs":
        data["crime_type"] = "property"  # Reclassify drugs as property crime for consistency
        return

    response = (
        supabase
        .table("scraped_data")
        .insert(values)
        .execute())
    
    print(response)



if __name__ == "__main__":
    SUPABASE_URL = os.getenv("DB_URL")
    SUPABASE_KEY = os.getenv("API_KEY")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    with open("output/combined_outputfit.txt", "r") as file:
        raw_markdown = file.read()

    asyncio.run(data_extraction(raw_markdown))