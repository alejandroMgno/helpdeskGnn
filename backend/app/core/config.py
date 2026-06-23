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

    # Defaults SMTP (Si no hay en BD)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_TLS: bool = os.getenv("SMTP_TLS", "True").lower() == "true"
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "alertas@tuempresa.com")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "GNN SAM Alerts")

    class Config:
        case_sensitive = True

settings = Settings()