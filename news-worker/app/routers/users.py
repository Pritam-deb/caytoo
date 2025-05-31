from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import UUID, Column, select, SQLModel, Field
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models import User
import uuid

import bcrypt  # You can use bcrypt for password hashing and verification
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from datetime import datetime, timedelta

# Secret key for JWT signing (store this in a secure place)
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 30

router = APIRouter(prefix="/users", tags=["users"])

# OAuth2 password bearer for login route
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
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


# Utility function to create JWT token
def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/", response_model=UserRead, status_code=201)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
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


@router.post("/login")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    # Check if the user exists in the database
    print("Form data:", form_data)
    statement = select(User).where(User.email == form_data.username)
    result = await db.execute(statement)
    user = result.scalar_one_or_none()
    
    # Verify password (you would need to hash the password in a real-world scenario)
    if not user or user.hashed_password != form_data.password:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
        )
    
    # Generate the JWT token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
    
@router.get("/", response_model=List[UserRead])
async def read_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users