# backend/app/db/database.py

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

 # PostgreSQL 
engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- NUEVO: Función para obtener sesión (Dependency) ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()