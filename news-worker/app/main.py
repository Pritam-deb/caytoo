# app/main.py
import redis
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, BackgroundTasks, Depends

from app.tasks.email_reader import process_gmail_alerts


from app.routers import users as users_router, emails as emails_route

from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("Starting up.....")
    redisDB = redis.Redis(host='redis', port=6379, db=0)
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    print(f"Redis connection established. Today's date: {today_str}")
    last_run = redisDB.get("last_gmail_alert_check")
    if last_run is not None:
        last_run = last_run.decode('utf-8')
    else:
        last_run = None
    if last_run != today_str:
        print("Running Gmail alert processor...")
        await process_gmail_alerts()
        redisDB.set("last_gmail_alert_check", today_str)
    else:
        print("Gmail alerts already processed today.")

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

# @app.on_event("startup")
# async def startup_event():
    
@app.get("/")
def read_root():
    return {"message": "FastAPI is running 🚀"}
