from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlmodel import SQLModel, Session

DATABASE_URL = "postgresql+asyncpg://admin:caytoodatabase@localhost:5432/postgresdb"  # Replace with your Docker PostgreSQL connection details

engine = create_async_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_db():
    with Session(engine) as session:
        yield session