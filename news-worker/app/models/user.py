from sqlmodel import Relationship, SQLModel, Field
from typing import List, Optional

from .user_topic_link import UserTopicLink

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    first_name: str | None = Field(default=None)
    last_name: str | None = Field(default=None)
    disabled: bool = Field(default=False)

    topics: List["Topic"] = Relationship(back_populates="users", link_model=UserTopicLink)