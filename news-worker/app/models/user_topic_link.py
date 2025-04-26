import uuid
from sqlmodel import UUID, Column, ForeignKey, SQLModel, Field, Relationship

class UserTopicLink(SQLModel, table=True):
    user_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("user.id"), primary_key=True, unique=True)
    )
    topic_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("topic.id"), primary_key=True, unique=True)
    )