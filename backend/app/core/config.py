import os
from pydantic_settings import BaseSettings # <--- La nueva ruta de importación

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zen-IT Enterprise API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Secretos y DB
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secreta_jwt_key")
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "sqlite:///./zen_it_prod.db")

    # Nueva sintaxis de Pydantic v2
    model_config = {"case_sensitive": True}

settings = Settings()