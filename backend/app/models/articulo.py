from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Text
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.db.base_class import Base

# Enum para la visibilidad (hace match con VisibilidadArticulo de tu schema)
class VisibilidadArticulo(str, enum.Enum):
    Externo = "Externo"
    Interno = "Interno"

class Articulo(Base):
    __tablename__ = "articulos"

    # Datos autogenerados (hacen match con ArticuloResponse)
    id = Column(Integer, primary_key=True, index=True)
    vistas = Column(Integer, default=0)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    # Datos base (hacen match con ArticuloBase)
    titulo = Column(String(200), nullable=False)
    categoria = Column(String(100), nullable=False)
    visibilidad = Column(Enum(VisibilidadArticulo), default=VisibilidadArticulo.Externo)
    imagenUrl = Column(String, nullable=True) # nullable=True hace match con Optional[str]
    contenido = Column(Text, nullable=False) # Usamos Text en lugar de String para textos largos

    # Relación con el Autor (hace match con autor_id y la clase anidada AutorInfo)
    autor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # El ORM trae el objeto Usuario completo, y tu schema "AutorInfo" filtra solo el 'nombre_completo'
    autor = relationship("Usuario", backref="articulos_publicados")