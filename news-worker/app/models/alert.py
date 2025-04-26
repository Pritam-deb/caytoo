import uuid
from sqlmodel import UUID, Column, ForeignKey, SQLModel, Field, Relationship
from typing import List, Optional


class Alert(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, unique=True)
    )
    name: str = Field(index=True, unique=True)
    description: str | None = Field(default=None)
    date: str | None = Field(default=None)
    user_id: UUID | None = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("user.id"), primary_key=True)
    )
    topic_id: UUID | None = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("topic.id"), primary_key=True)
    )
    created_at: str | None = Field(default=None)
    updated_at: str | None = Field(default=None)

    class Config:
        arbitrary_types_allowed = True
