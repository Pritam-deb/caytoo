# app/config.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlmodel import SQLModel, Session

DATABASE_URL = "postgresql+asyncpg://admin:caytoodatabase@localhost:5432/postgresdb"
