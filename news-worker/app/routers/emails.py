# app/routers/emails.py
from fastapi import APIRouter, BackgroundTasks
import time  # Add this at the top with other imports
from app.tasks.email_reader import process_gmail_alerts
from app.services.scraper_service import ScraperService  # <-- Add this import

router = APIRouter(prefix="/emails", tags=["emails"])


@router.get("/links/")
async def read_emails(background_tasks: BackgroundTasks):
    # background_tasks.add_task(process_gmail_alerts)
    await process_gmail_alerts()
    print("Gmail alerts processed.")
    return {"status": "Gmail alerts processed."}


@router.get("/scrape/")
async def scrape_articles():
    scraper = ScraperService()
    scraper.scrape_all()
    return {"status": "Scraping articles now."}