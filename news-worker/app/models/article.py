from typing import Optional
import uuid
from sqlmodel import UUID, Column, Date, Field, ForeignKey, SQLModel
from datetime import date, datetime

class Article(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, unique=True)
    )
    title: str
    content: str
    url_link: str
    alert_id: UUID | None = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("alert.id"), primary_key=True)
    )
    created_at: str
    updated_at: str
    date: str

    class Config:
        arbitrary_types_allowed = True
