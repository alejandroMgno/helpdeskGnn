from pydantic import BaseModel
from typing import Optional

class MarcaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class MarcaCreate(MarcaBase):
    pass

class MarcaResponse(MarcaBase):
    id: int
    class Config:
        from_attributes = True

class ProveedorBase(BaseModel):
    nombre: str
    rfc: Optional[str] = None
    contacto_nombre: Optional[str] = None
    contacto_telefono: Optional[str] = None
    contacto_email: Optional[str] = None
    notas: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorResponse(ProveedorBase):
    id: int
    class Config:
        from_attributes = True

class SLAConfigBase(BaseModel):
    prioridad: str
    horas: int
    descripcion: Optional[str] = None

class SLAConfigCreate(SLAConfigBase):
    pass

class SLAConfigResponse(SLAConfigBase):
    id: int
    class Config:
        from_attributes = True

class CategoriaBase(BaseModel):
    nombre: str
    icono: Optional[str] = "pi pi-box"

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaResponse(CategoriaBase):
    id: int
    class Config:
        from_attributes = True

# --- SCHEMAS ORGANIZACIONALES ---

class ZonaBase(BaseModel):
    nombre: str

class ZonaCreate(ZonaBase):
    pass

class ZonaResponse(ZonaBase):
    id: int
    class Config:
        from_attributes = True

class CentroCostoBase(BaseModel):
    codigo: str
    nombre: str

class CentroCostoCreate(CentroCostoBase):
    pass

class CentroCostoResponse(CentroCostoBase):
    id: int
    class Config:
        from_attributes = True

class PuestoBase(BaseModel):
    nombre: str

class PuestoCreate(PuestoBase):
    pass

class PuestoResponse(PuestoBase):
    id: int
    class Config:
        from_attributes = True

class DepartamentoBase(BaseModel):
    nombre: str
    zona_id: int
    centro_costo_id: int

class DepartamentoCreate(DepartamentoBase):
    pass

class DepartamentoResponse(BaseModel):
    id: int
    nombre: str
    zona_id: int
    centro_costo_id: int
    zona: Optional[ZonaResponse] = None
    centro_costo: Optional[CentroCostoResponse] = None
    
    class Config:
        from_attributes = True

class ModeloParteBase(BaseModel):
    numero_parte: str
    nombre: str
    descripcion: Optional[str] = None
    marca_id: Optional[int] = None
    tipo: Optional[str] = None
    ram: Optional[str] = None
    cpu: Optional[str] = None
    almacenamiento: Optional[str] = None
    pulgadas: Optional[str] = None
    rma: Optional[str] = None
    especificaciones_json: Optional[dict] = None

class ModeloParteCreate(ModeloParteBase):
    pass

class ModeloParteResponse(ModeloParteBase):
    id: int
    marca: Optional[MarcaResponse] = None
    class Config:
        from_attributes = True
