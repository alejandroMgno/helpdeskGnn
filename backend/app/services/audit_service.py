# backend/app/services/audit_service.py
from sqlalchemy.orm import Session
from app.models.auditoria import RegistroAuditoria
from datetime import datetime
from typing import Any, Optional
from fastapi.encoders import jsonable_encoder

def registrar_accion(
    db: Session,
    usuario_id: int,
    accion: str,
    tabla: str,
    registro_id: int,
    previo: Optional[Any] = None,
    nuevo: Optional[Any] = None,
    ip: Optional[str] = None
):
    """Registra una acción en el log de auditoría."""
    log = RegistroAuditoria(
        usuario_id=usuario_id,
        accion=accion,
        tabla_afectada=tabla,
        registro_id=registro_id,
        detalles_previos=jsonable_encoder(previo) if previo is not None else None,
        detalles_nuevos=jsonable_encoder(nuevo) if nuevo is not None else None,
        ip_origen=ip,
        fecha=datetime.utcnow()
    )
    db.add(log)
    db.commit()
