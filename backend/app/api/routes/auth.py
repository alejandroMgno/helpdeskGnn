# backend/app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.api.dependencies import get_db
from app.models.usuario import Usuario
from app.core.security import verify_password, create_access_token
from app.schemas.usuario import UsuarioResponse
from app.api.dependencies import get_current_user
from app.schemas.usuario import UsuarioResponse

router = APIRouter()

@router.post("/login")
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Autenticación para obtener el token (OAuth2)"""
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
    if user.estatus == "Inactivo":
        raise HTTPException(status_code=400, detail="Usuario inactivo")
        
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre_completo": user.nombre_completo,
            "email": user.email,
            "rol": user.rol,
            "avatar_url": f"https://ui-avatars.com/api/?name={user.nombre_completo.replace(' ', '+')}&background=0891b2&color=fff"
        }
    }

@router.get("/me", response_model=UsuarioResponse)
def read_usuario_actual(current_user: Usuario = Depends(get_current_user)):
    """
    Retorna los datos del usuario dueño del Token JWT actual.
    Esto es lo que React usa en App.jsx para validar la sesión.
    """
    return current_user