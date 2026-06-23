# backend/app/api/dependencies.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.core.config import settings
from app.models.usuario import Usuario, RolUsuario, EstatusUsuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(Usuario).filter(Usuario.id == int(user_id)).first() # Convertimos a int por seguridad
    if user is None:
        raise credentials_exception
    return user

# NUEVO: Verifica que el usuario no esté dado de baja
def get_current_active_user(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.estatus != EstatusUsuario.Activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user

# NUEVO: Verifica que sea Administrador (útil para crear/borrar usuarios o activos)
def get_current_admin(current_user: Usuario = Depends(get_current_active_user)) -> Usuario:
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="No tienes permisos de Administrador")
    return current_user