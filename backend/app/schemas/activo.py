# backend/app/schemas/activo.py
from pydantic import BaseModel
from typing import Optional
from app.models.activo import TipoActivo, EstatusActivo

class ActivoBase(BaseModel):
    codigo: str
    nombre: str
    tipo: TipoActivo = TipoActivo.Computo
    estatus: EstatusActivo = EstatusActivo.Disponible
    usuario_id: Optional[int] = None

class ActivoCreate(ActivoBase):
    pass

class ActivoResponse(ActivoBase):
    id: int

    class Config:
        from_attributes = True