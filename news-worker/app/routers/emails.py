# app/routers/emails.py
from fastapi import APIRouter, BackgroundTasks
from app.tasks.email_reader import process_gmail_alerts

router = APIRouter(prefix="/emails", tags=["emails"])


@router.post("/read/")
async def read_emails(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_gmail_alerts)
    return {"status": "Reading Gmail alerts in background."}