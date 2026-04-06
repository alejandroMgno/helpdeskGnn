# backend/app/api/routes/activos.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.activo import Activo
from app.schemas.activo import ActivoCreate, ActivoResponse

router = APIRouter()

@router.post("/", response_model=ActivoResponse)
def crear_activo(activo_in: ActivoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    # Solo Admins o Técnicos deberían poder registrar inventario
    if current_user.rol.value not in ["Admin", "Tecnico"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para registrar activos.")
        
    nuevo_activo = Activo(**activo_in.dict())
    db.add(nuevo_activo)
    db.commit()
    db.refresh(nuevo_activo)
    return nuevo_activo

@router.get("/", response_model=List[ActivoResponse])
def listar_activos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    # Si es un usuario normal, solo ve sus propios equipos
    if current_user.rol.value == "Usuario":
        return db.query(Activo).filter(Activo.usuario_id == current_user.id).all()
    # Si es Admin/Técnico, ve todo el inventario
    return db.query(Activo).all()