import uuid
from sqlmodel import UUID, Column, SQLModel, Field, Relationship
from typing import List, Optional


class Alert(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    name: str = Field(index=True, unique=True)
    description: str | None = Field(default=None)
    date: str | None = Field(default=None)
    user_id: int | None = Field(default=None, foreign_key="user.id")
    topic_id: int | None = Field(default=None, foreign_key="topic.id")
    created_at: str | None = Field(default=None)
    updated_at: str | None = Field(default=None)
