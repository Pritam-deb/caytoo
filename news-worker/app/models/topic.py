from sqlmodel import SQLModel, Field, Relationship
from typing import List
from .user_topic_link import UserTopicLink

class Topic(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    description: str | None = Field(default=None)

    users: List["User"] = Relationship(back_populates="topics", link_model=UserTopicLink)