import uuid
from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.declarative import declarative_base


class User(Base):
    __tablename__ = "user"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    public_key = Column(String)
    email = Column(String, unique=True, index=True, nullable=False)
    credential_id = Column(String, unique=True, index=True)
    is_active = Column(Boolean, default=True)

    @classmethod
    async def create(self, user, session):
        session.add(user)
        try:
            await session.commit()
            session.refresh(user)
            return user
        except IntegrityError as e:
            session.rollback()
            if (
                "unique constraint" in str(e.orig).lower()
                or "duplicate key" in str(e.orig).lower()
            ):
                raise HTTPException(status_code=400, detail="Email already registered")
            raise HTTPException(status_code=400, detail="Database integrity error")
        except Exception:
            session.rollback()
            raise HTTPException(status_code=500, detail="Internal server error")
