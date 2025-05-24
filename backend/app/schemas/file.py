from pydantic import BaseModel
import uuid
from datetime import datetime


class FileCreate(BaseModel):
    owner_id: uuid.UUID
    filename: str
    content_type: str
    path: str


class FileRead(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    filename: str
    content_type: str
    path: str
    uploaded_at: datetime
    is_shared: bool

    class Config:
        from_attributes = True
