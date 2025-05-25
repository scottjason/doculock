import os
import uuid
from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from jwt import decode, ExpiredSignatureError, InvalidTokenError


class User(Base):
    __tablename__ = "user"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    public_key = Column(String)
    email = Column(String, unique=True, index=True, nullable=False)
    credential_id = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
