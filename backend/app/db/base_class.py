from sqlalchemy import Column, Integer, Boolean, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()

class AuditBaseModel(Base):
    __abstract__ = True
    id = Column(Integer, primary_key=True, index=True)
    is_active = Column(Boolean, default=True) # Soft Delete
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)