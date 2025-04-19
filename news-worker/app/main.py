from fastapi import FastAPI, BackgroundTasks
from app.tasks.email_reader import process_gmail_alerts
# from app.tasks.news_api import fetch_from_news_api
# from app.tasks.scraper import scrape_websites
# from app.tasks.rss_reader import fetch_from_rss_feeds

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "FastAPI is running 🚀"}

@app.post("/read-emails/")
async def read_emails(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_gmail_alerts)
    return {"status": "Reading Gmail alerts in background."}

# @app.post("/fetch-news-api/")
# async def fetch_news_api_handler(background_tasks: BackgroundTasks):
#     background_tasks.add_task(fetch_from_news_api)
#     return {"status": "Fetching news from API in background."}

# @app.post("/scrape-news-sites/")
# async def scrape_news_sites(background_tasks: BackgroundTasks):
#     background_tasks.add_task(scrape_websites)
#     return {"status": "Scraping news websites in background."}

# @app.post("/rss-feed/")
# async def rss_feed(background_tasks: BackgroundTasks):
#     background_tasks.add_task(fetch_from_rss_feeds)
#     return {"status": "Fetching RSS feeds in background."}