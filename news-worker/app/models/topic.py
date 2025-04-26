import uuid
from sqlmodel import UUID, Column, SQLModel, Field, Relationship
from typing import List, Optional
from .user_topic_link import UserTopicLink

class Topic(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, unique=True)
    )
    name: str = Field(index=True, unique=True)
    description: str | None = Field(default=None)

    users: List["User"] = Relationship(back_populates="topics", link_model=UserTopicLink)