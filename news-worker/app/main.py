# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Depends

from app.tasks.email_reader import process_gmail_alerts


from app.routers import users as users_router, emails as emails_route

from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("Starting up...")
    yield
    # Code to run on shutdown
    print("Shutting down...")
    # The engine is now managed in database.py, no need to dispose here

app = FastAPI(lifespan=lifespan)

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router.router)
app.include_router(emails_route.router)

@app.get("/")
def read_root():
    return {"message": "FastAPI is running 🚀"}
