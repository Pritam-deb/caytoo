from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
import uuid
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID

from .user_topic_link import UserTopicLink

class User(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, unique=True),
    )
    email: str = Field(index=True, unique=True)
    hashed_password: str
    first_name: str | None = Field(default=None)
    last_name: str | None = Field(default=None)
    disabled: bool = Field(default=False)

    topics: List["Topic"] = Relationship(back_populates="users", link_model=UserTopicLink)