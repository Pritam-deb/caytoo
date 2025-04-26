from sqlmodel import SQLModel, Field, Relationship

class UserTopicLink(SQLModel, table=True):
    user_id: int = Field(foreign_key="user.id", primary_key=True)
    topic_id: int = Field(foreign_key="topic.id", primary_key=True)