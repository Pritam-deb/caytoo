from typing import Optional
import uuid
from sqlmodel import UUID, Column, Field, SQLModel


class Article(SQLModel, table=True):
    id: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True)
    )
    title: str
    content: str
    url_link: str
    alert_id: int | None = Field(default=None, foreign_key="alert.id")
    created_at: str
    updated_at: str

    class Config:
        orm_mode = True
        arbitrary_types_allowed = True
        json_encoders = {
            # Add any custom encoders here if needed
        }
        json_decoders = {
            # Add any custom decoders here if needed
        }
        schema_extra = {
            "example": {
                "id": 1,
                "title": "Sample Article",
                "content": "This is a sample article content.",
                "author_id": 1,
                "created_at": "2023-10-01T12:00:00Z",
                "updated_at": "2023-10-01T12:00:00Z",
            }
        }


    