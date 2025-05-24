import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base


class SharedFile(Base):
    __tablename__ = "shared_file"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("file.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=True)
    guest_email = Column(String, nullable=True)

    file = relationship("File", back_populates="shares")
