# middleware/user.py
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from passlib.context import CryptContext
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserInDB:
    """
    Lightweight user storage model. Replace with your DB model later.
    """
    def __init__(self, username: str, email: str, hashed_password: str, is_active: bool = True):
        self.username = username
        self.email = email
        self.hashed_password = hashed_password
        self.is_active = is_active
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def verify_password(self, plain_password: str) -> bool:
        return pwd_context.verify(plain_password, self.hashed_password)

    @classmethod
    def hash_password(cls, plain_password: str) -> str:
        return pwd_context.hash(plain_password)


# Pydantic models for request/response
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserOut(BaseModel):
    username: str
    email: EmailStr
    is_active: bool


# Example helper functions (in-memory user store for illustration)
_in_memory_users = {}  # key: username -> UserInDB

def create_user(username: str, email: str, password: str) -> UserOut:
    if username in _in_memory_users:
        raise ValueError("User already exists")
    hashed = UserInDB.hash_password(password)
    user = UserInDB(username=username, email=email, hashed_password=hashed)
    _in_memory_users[username] = user
    return UserOut(username=username, email=email, is_active=user.is_active)

def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = _in_memory_users.get(username)
    if not user:
        return None
    if not user.verify_password(password):
        return None
    return user
