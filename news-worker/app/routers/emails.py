# app/routers/emails.py
from fastapi import APIRouter, BackgroundTasks
import time  # Add this at the top with other imports
from app.tasks.email_reader import process_gmail_alerts
from app.services.scraper_service import ScraperService  # <-- Add this import

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("/read/")
async def read_emails(background_tasks: BackgroundTasks):
    # background_tasks.add_task(process_gmail_alerts)
    await process_gmail_alerts()
    print("Gmail alerts processed.")
    # Add background task to scrape articles
    def scrape_articles_task():
        # time.sleep(5)  # Wait a bit to let Gmail alerts processing start
        scraper = ScraperService()
        scraper.scrape_all()
    
    background_tasks.add_task(scrape_articles_task)
    
    return {"status": "Scraping articles in background."}