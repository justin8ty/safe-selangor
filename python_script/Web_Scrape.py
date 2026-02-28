import link_crawler_supa as link_crawler
import data_crawler_supa as data_crawler
import data_extraction_supa as data_extraction
import runpy

if __name__ == "__main__":
    # Step 1: Crawl links
    print("Starting link crawling...")
    runpy.run_module("link_crawler_supa", run_name="__main__") 

    # Step 2: Crawl data from the links
    print("Starting data crawling...")
    runpy.run_module("data_crawler_supa", run_name="__main__") 

    # Step 3: Extract structured data from the crawled content
    print("Starting data extraction...")
    runpy.run_module("data_extraction_supa", run_name="__main__") 