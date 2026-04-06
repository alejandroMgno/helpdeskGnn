from pydantic import BaseModel
from typing import Optional

class ActivoBase(BaseModel):
    etiqueta_gnn: str
    nombre: str
    serie: Optional[str] = None
    categoria: str
    status: Optional[str] = "activo"

class ActivoCreate(ActivoBase):
    frecuencia_meses: Optional[int] = 0
    usuario_id: Optional[int] = None
    marca_id: Optional[int] = None
    proveedor_id: Optional[int] = None

class ActivoResponse(ActivoBase):
    id: int
    usuario_id: Optional[int] = None
    marca_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    factura_url: Optional[str] = None

    class Config:
        from_attributes = True