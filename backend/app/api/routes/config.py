from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user
from app.models.usuario import RolUsuario
from app.models.config import ConfiguracionSMTP
from app.schemas.config import SMTPConfigUpdate, SMTPConfigResponse

router = APIRouter()

@router.get("/smtp", response_model=SMTPConfigResponse)
def get_smtp_config(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    # Permitir a Técnicos ver (para que no falle el frontend), pero solo Admin ve todo real
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No autorizado")
    
    config = db.query(ConfiguracionSMTP).first()
    if not config:
        config = ConfiguracionSMTP()
        db.add(config)
        db.commit()
        db.refresh(config)
    
    # Si es técnico, ocultamos la contraseña por seguridad
    if current_user.rol == RolUsuario.Tecnico:
        config_copy = SMTPConfigResponse.model_validate(config)
        config_copy.smtp_password = "****************"
        return config_copy
        
    return config

@router.put("/smtp", response_model=SMTPConfigResponse)
def update_smtp_config(config_in: SMTPConfigUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    config = db.query(ConfiguracionSMTP).first()
    if not config:
        config = ConfiguracionSMTP()
        db.add(config)
    
    for field, value in config_in.model_dump().items():
        setattr(config, field, value)
    
    db.commit()
    db.refresh(config)
    return config
