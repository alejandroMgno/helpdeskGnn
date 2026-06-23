from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.articulo import VisibilidadArticulo

class ArticuloBase(BaseModel):
    titulo: str
    categoria: str
    visibilidad: VisibilidadArticulo = VisibilidadArticulo.Externo
    imagenUrl: Optional[str] = None
    contenido: str

class ArticuloCreate(ArticuloBase):
    pass

class ArticuloUpdate(BaseModel):
    titulo: Optional[str] = None
    categoria: Optional[str] = None
    visibilidad: Optional[VisibilidadArticulo] = None
    imagenUrl: Optional[str] = None
    contenido: Optional[str] = None

# Mini-esquema para devolver solo el nombre del autor
class AutorInfo(BaseModel):
    nombre_completo: str
    
    class Config:
        from_attributes = True

class ArticuloResponse(ArticuloBase):
    id: int
    vistas: int
    fecha_creacion: datetime
    autor_id: int
    autor: AutorInfo  # Incluimos los datos del autor al responder

    class Config:
        from_attributes = True