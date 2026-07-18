from pydantic import BaseModel, EmailStr
from uuid import UUID
from app.models.user import UserRole, UserStatus
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: UserRole

class UserResponse(UserBase):
    id: UUID
    role: UserRole
    status: UserStatus
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
