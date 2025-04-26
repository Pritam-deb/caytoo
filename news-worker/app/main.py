from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlmodel import SQLModel, Session  # Import Session from sqlmodel
from app.config import DATABASE_URL  # Import your DATABASE_URL
from app.tasks.email_reader import process_gmail_alerts

#  (1)  Create an async engine with the asyncpg driver
engine = create_async_engine(DATABASE_URL, echo=True)

# (2)  Async function to create tables
async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

# (3)  Async Dependency
async def get_db():
    async_session = AsyncSession(engine)
    try:
        yield async_session
    finally:
        await async_session.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("Starting up...")
    await create_db_and_tables()
    print("Database and tables created.")
    yield
    # Code to run on shutdown
    print("Shutting down...")
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "FastAPI is running 🚀"}

@app.post("/read-emails/")
async def read_emails(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_gmail_alerts)
    return {"status": "Reading Gmail alerts in background."}