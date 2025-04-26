# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Depends
from app.database import create_db_and_tables, get_db
from app.tasks.email_reader import process_gmail_alerts
from app.models import User, Topic, UserTopicLink  # Import your models
from sqlmodel import Session

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("Starting up...")
    await create_db_and_tables()
    print("Database and tables created.")
    yield
    # Code to run on shutdown
    print("Shutting down...")
    # The engine is now managed in database.py, no need to dispose here

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "FastAPI is running 🚀"}

@app.post("/read-emails/")
async def read_emails(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_gmail_alerts)
    return {"status": "Reading Gmail alerts in background."}

# Example route to demonstrate using the database session
@app.get("/users/")
async def read_users(db: Session = Depends(get_db)):
    users = await db.exec(select(User)).all()
    return users