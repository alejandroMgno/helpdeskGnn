# backend/app/schemas/activo.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.usuario import UsuarioResponse
from app.schemas.catalogos import MarcaResponse, ProveedorResponse, ModeloParteResponse

class ActivoBase(BaseModel):
    codigo: str
    numero_parte: Optional[str] = None
    modelo_parte_id: Optional[int] = None
    nombre: str
    modelo: Optional[str] = None
    marca_texto: Optional[str] = None
    marca_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    tipo: str = "Equipo de Cómputo"
    estatus: str = "Disponible"
    historial: Optional[List[dict]] = []
    motivo_baja: Optional[str] = None
    fecha_baja: Optional[datetime] = None

    # Especificaciones Técnicas
    imei: Optional[str] = None
    chip: Optional[str] = None
    serie: Optional[str] = None
    ram: Optional[str] = None
    cpu: Optional[str] = None
    pulgadas: Optional[str] = None
    almacenamiento: Optional[str] = None
    formato: Optional[str] = None
    rma: Optional[str] = None

    # Datos Financieros y Documentación
    costo: float = 0.0
    factura_numero: Optional[str] = None
    documentos: Optional[List[str]] = []
    fecha_compra: Optional[datetime] = None
    anios_garantia: int = 1

    # Mantenimiento
    fecha_ultimo_mantenimiento: Optional[datetime] = None
    meses_mantenimiento: int = 6
    fecha_proximo_mantenimiento: Optional[datetime] = None

    usuario_id: Optional[int] = None

class ActivoBaja(BaseModel):
    motivo: str # Robo, Venta, Obsolescencia
    notas: Optional[str] = None

class ActivoCreate(ActivoBase):
    pass

class ActivoUpdate(BaseModel):
    nombre: Optional[str] = None
    numero_parte: Optional[str] = None
    modelo_parte_id: Optional[int] = None
    modelo: Optional[str] = None
    marca_texto: Optional[str] = None
    marca_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    estatus: Optional[str] = None
    usuario_id: Optional[int] = None
    documentos: Optional[List[str]] = None
    fecha_ultimo_mantenimiento: Optional[datetime] = None
    meses_mantenimiento: Optional[int] = None
    fecha_proximo_mantenimiento: Optional[datetime] = None
    costo: Optional[float] = None
    factura_numero: Optional[str] = None
    imei: Optional[str] = None
    chip: Optional[str] = None
    serie: Optional[str] = None
    ram: Optional[str] = None
    cpu: Optional[str] = None
    pulgadas: Optional[str] = None
    almacenamiento: Optional[str] = None
    formato: Optional[str] = None
    rma: Optional[str] = None
    notas: Optional[str] = None # Para el historial

class MantenimientoBase(BaseModel):
    tipo: str
    fecha: datetime
    descripcion: str
    costo: float = 0.0
    notas_internas: Optional[str] = None

class MantenimientoCreate(MantenimientoBase):
    pass

class MantenimientoResponse(MantenimientoBase):
    id: int
    activo_id: int
    tecnico_id: Optional[int]

    class Config:
        from_attributes = True

class LicenciaEnActivo(BaseModel):
    id: int
    nombre: str
    categoria: str
    estatus: str

    class Config:
        from_attributes = True

class ActivoResponse(ActivoBase):
    id: int
    fecha_compra: datetime
    mantenimientos: List[MantenimientoResponse] = []
    usuario: Optional[UsuarioResponse] = None
    marca: Optional[MarcaResponse] = None
    proveedor: Optional[ProveedorResponse] = None
    modelo_parte: Optional[ModeloParteResponse] = None
    licencias: List[LicenciaEnActivo] = []

    class Config:
        from_attributes = True