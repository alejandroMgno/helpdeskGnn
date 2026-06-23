from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date
from app.schemas.catalogos import ProveedorResponse

class LicenciaBase(BaseModel):
    nombre: str
    categoria: str
    proveedor_id: Optional[int] = None
    proveedor_texto: Optional[str] = None
    costo_anual: float = 0.0
    fecha_compra: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    asientos_totales: int = 1
    llave: Optional[str] = None

class LicenciaCreate(LicenciaBase):
    pass

class LicenciaUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    proveedor_id: Optional[int] = None
    proveedor_texto: Optional[str] = None
    costo_anual: Optional[float] = None
    fecha_compra: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    asientos_totales: Optional[int] = None
    llave: Optional[str] = None
    asientos_asignados: Optional[List[str]] = None
    historial: Optional[List[Dict[str, Any]]] = None
    documentos: Optional[List[str]] = None
    estatus: Optional[str] = None

class ActivoEnLicencia(BaseModel):
    id: int
    codigo: str
    nombre: str
    estatus: str

    class Config:
        from_attributes = True

class UsuarioEnLicencia(BaseModel):
    id: int
    nombre_completo: str
    email: str

    class Config:
        from_attributes = True

class LicenciaResponse(LicenciaBase):
    id: int
    asientos_asignados: List[str] = []
    asientos_usados: int = 0
    asientos_disponibles: int = 0
    historial: List[Dict[str, Any]] = []
    documentos: List[str] = []
    is_deleted: bool = False
    estatus: str
    proveedor: Optional[ProveedorResponse] = None
    activos: List[ActivoEnLicencia] = []
    usuarios: List[UsuarioEnLicencia] = []

    class Config:
        from_attributes = True