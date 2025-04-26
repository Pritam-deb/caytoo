# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Depends
from app.database import create_db_and_tables, get_db
from app.tasks.email_reader import process_gmail_alerts
from app.models import User, Topic, UserTopicLink  # Import your models
from sqlmodel import Session
from app.routers import users as users_router, emails as emails_router

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

app.include_router(users_router.router)
app.include_router(emails_router.router)

@app.get("/")
def read_root():
    return {"message": "FastAPI is running 🚀"}
