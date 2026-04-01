from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/", response_model=UsuarioResponse)
def crear_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    # 1. Verificar si el correo ya existe
    user_existente = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
    if user_existente:
        raise HTTPException(status_code=400, detail="El correo ya está registrado en el sistema")
    
    # 2. Encriptar la contraseña y mapear TODOS los campos del modelo
    usuario_db = Usuario(
        email=usuario_in.email,
        nombre=usuario_in.nombre,
        hashed_password=get_password_hash(usuario_in.password),
        rol=usuario_in.rol,
        zona=usuario_in.zona,
        departamento=usuario_in.departamento,
        centro_costo=usuario_in.centro_costo,                    # Mapeado
        status=usuario_in.status,
        tecnico_preferente_id=usuario_in.tecnico_preferente_id   # Mapeado
    )
    
    db.add(usuario_db)
    db.commit()
    db.refresh(usuario_db)
    return usuario_db

# NUEVO ENDPOINT: Vital para el frontend
@router.get("/me", response_model=UsuarioResponse)
def obtener_usuario_actual(current_user: Usuario = Depends(get_current_user)):
    """
    Devuelve los datos del usuario que actualmente tiene sesión iniciada por JWT.
    """
    return current_user

@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user) # Ruta protegida
):
    # Solo listamos los usuarios que no han sido borrados (Soft Delete)
    usuarios = db.query(Usuario).filter(Usuario.is_active == True).offset(skip).limit(limit).all()
    return usuarios