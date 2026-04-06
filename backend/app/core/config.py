# backend/app/core/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zenit Service Desk API"
    VERSION: str = "1.0.0" 
    API_V1_STR: str = "/api/v1"
    
    # Seguridad (JWT)
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-cambiar-en-produccion")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  
    
    # Ponemos AMBAS variables para que ningún archivo tuyo falle, sin importar cómo la llame
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./zenit_desk.db")
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "sqlite:///./zenit_desk.db")

    class Config:
        case_sensitive = True

settings = Settings()