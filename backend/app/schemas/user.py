from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional
from app.models.user import UserRole, UserStatus
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: UserRole
    phone_number: Optional[str] = None
    parent_email: Optional[EmailStr] = None

class UserResponse(UserBase):
    id: UUID
    role: UserRole
    status: UserStatus
    is_verified: bool
    phone_number: Optional[str] = None
    trust_level: int
    created_at: datetime

    class Config:
        from_attributes = True
