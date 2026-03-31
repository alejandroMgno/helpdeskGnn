from pydantic import BaseModel
from typing import Optional
from datetime import date

class ActivoBase(BaseModel):
    numero_serie: str
    modelo: str
    marca: str
    proveedor: str
    costo: float

class ActivoCreate(ActivoBase):
    pass

class ActivoResponse(ActivoBase):
    id: int
    is_active: bool
    estatus_operativo: str
    usuario_asignado_id: Optional[int]

    class Config:
        orm_mode = True # Permite leer objetos SQLAlchemy