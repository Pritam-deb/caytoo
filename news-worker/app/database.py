# app/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlmodel import SQLModel
from app.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=True)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

async def get_db():
    async_session = AsyncSession(engine)
    try:
        yield async_session
    finally:
        await async_session.close()