# backend/app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import secrets
from app.db.database import SessionLocal
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario, EstatusUsuario, RolUsuario, StatusTecnico # Importamos modelos y enums
from app.core.security import verify_password, create_access_token, get_password_hash
from app.schemas.usuario import UsuarioResponse
from app.services.websocket_manager import manager # Para notificar cambios de estado
from app.services.email_service import notificar_recuperacion_password

router = APIRouter()

@router.post("/login")
async def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    """Autenticación para obtener el token (OAuth2)"""
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
        
    # CORRECCIÓN: Usamos el Enum explícito para evitar bugs por "Magic Strings"
    if user.estatus == EstatusUsuario.Inactivo:
        raise HTTPException(status_code=400, detail="Usuario inactivo. Contacte al administrador.")
        
    # VERIFICACIÓN DE EMAIL
    if not user.is_email_verified:
        raise HTTPException(status_code=400, detail="Cuenta no verificada. Revisa tu correo.")
        
    # ✅ LÓGICA DE PRESENCIA: Si es técnico, inicia como Activo
    if user.rol in [RolUsuario.Tecnico, RolUsuario.Admin]:
        user.status_tecnico = StatusTecnico.Activo
        user.ausente = False
        db.commit()
        # Notificar al dashboard que un técnico está activo
        await manager.broadcast_global({"type": "update_dashboard"})

    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "nombre_completo": user.nombre_completo,
            "email": user.email,
            "rol": user.rol,
            "debe_cambiar_password": user.debe_cambiar_password,
            "avatar_url": f"https://ui-avatars.com/api/?name={user.nombre_completo.replace(' ', '+')}&background=0891b2&color=fff"
        }
    }

@router.post("/verify-email/{token}")
async def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email_verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Token inválido")
    
    user.is_email_verified = True
    user.email_verification_token = None
    db.commit()
    return {"message": "Cuenta verificada correctamente"}


@router.post("/forgot-password")
async def forgot_password(email: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user:
        # Por seguridad no revelamos si el email existe o no, pero aquí el prompt dice que enviamos correo
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Generar password temporal
    temp_pass = secrets.token_urlsafe(8)
    user.hashed_password = get_password_hash(temp_pass)
    user.debe_cambiar_password = True
    db.commit()
    
    background_tasks.add_task(notificar_recuperacion_password, user.email, temp_pass)
    
    return {"message": "Correo de recuperación enviado"}

@router.post("/change-password")
async def change_password(new_password: str = Body(..., embed=True), db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    current_user.hashed_password = get_password_hash(new_password)
    current_user.debe_cambiar_password = False
    db.commit()
    return {"message": "Contraseña actualizada correctamente"}

@router.get("/me", response_model=UsuarioResponse)
async def read_usuario_actual(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """
    Retorna los datos del usuario dueño del Token JWT actual.
    Esto es lo que React usa en App.jsx para validar la sesión.
    También asegura que el técnico esté Activo si está usando la app.
    """
    if current_user.rol in [RolUsuario.Tecnico, RolUsuario.Admin] and current_user.status_tecnico == StatusTecnico.Ausente:
        current_user.status_tecnico = StatusTecnico.Activo
        current_user.ausente = False
        db.commit()
        await manager.broadcast_global({"type": "update_dashboard"})
        
    return current_user

@router.post("/logout")
async def logout(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Set status to Absent upon logout if user is a technician."""
    if current_user.rol in [RolUsuario.Tecnico, RolUsuario.Admin]:
        current_user.status_tecnico = StatusTecnico.Ausente
        current_user.ausente = True
        db.commit()
        await manager.broadcast_global({"type": "update_dashboard"})
    return {"status": "ok", "mensaje": "Sesión cerrada correctamente"}