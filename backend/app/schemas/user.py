from pydantic import BaseModel
import uuid


class UserCreate(BaseModel):
    email: str


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    is_active: bool

    class Config:
        from_attributes = True
