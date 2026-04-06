# backend/app/api/routes/usuarios.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.models.usuario import Usuario
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/", response_model=List[UsuarioResponse])
def read_usuarios(db: Session = Depends(get_db), skip: int = 0, limit: int = 100, current_user: Usuario = Depends(get_current_user)) -> Any:
    """Obtener todos los usuarios."""
    usuarios = db.query(Usuario).offset(skip).limit(limit).all()
    return usuarios

@router.post("/", response_model=UsuarioResponse)
def create_usuario(*, db: Session = Depends(get_db), user_in: UsuarioCreate, current_user: Usuario = Depends(get_current_user)) -> Any:
    """Crear un nuevo usuario."""
    usuario = db.query(Usuario).filter(Usuario.email == user_in.email).first()
    if usuario:
        raise HTTPException(status_code=400, detail="El email ya está registrado en el sistema.")
    
    user_data = user_in.dict(exclude={"password"})
    user_data["hashed_password"] = get_password_hash(user_in.password)
    
    nuevo_usuario = Usuario(**user_data)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario