from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import UUID, Column, Session, select, SQLModel, Field
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models import User
import uuid

router = APIRouter(prefix="/users", tags=["users"])

class UserCreate(SQLModel):
    email: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserRead(SQLModel):
    id: uuid.UUID
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    disabled: bool = False


@router.post("/", response_model=UserRead, status_code=201)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = user.password  # In a real application, hash this!
    db_user = User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
    )
    try:
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Email already registered")
    
    
@router.get("/", response_model=List[UserRead])
async def read_users(db: Session = Depends(get_db)):
    users = await db.exec(select(User)).all()
    return users