from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from alembic import context
from sqlmodel import SQLModel

# Import your models
from app.models.article import Article
from app.models.alert import Alert
from app.models.user import User
from app.models.topic import Topic

from app.config import DATABASE_URL

# Config
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Use SQLModel's metadata
target_metadata = SQLModel.metadata

# Fix database URL (remove asyncpg)
DATABASE_URL_SYNC = DATABASE_URL.replace("+asyncpg", "")

# Create sync engine
connectable = create_engine(DATABASE_URL_SYNC, poolclass=pool.NullPool)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=DATABASE_URL_SYNC,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()