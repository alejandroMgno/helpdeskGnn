# backend/app/models/activo.py
from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from app.db.base_class import Base

class TipoActivo(str, enum.Enum):
    Computo = "Equipo de Cómputo"
    Licencia = "Licencia de Software"
    Periferico = "Periférico"
    Red = "Equipo de Red"

class EstatusActivo(str, enum.Enum):
    Asignado = "Asignado"
    Disponible = "Disponible"
    Mantenimiento = "En Mantenimiento"
    Baja = "Dado de Baja"

class Activo(Base):
    __tablename__ = "activos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True, nullable=False) # Ej. LAP-001
    nombre = Column(String(150), nullable=False)
    tipo = Column(Enum(TipoActivo), default=TipoActivo.Computo)
    estatus = Column(Enum(EstatusActivo), default=EstatusActivo.Disponible)
    
    # A quién pertenece este equipo
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relación ORM
    usuario = relationship("Usuario", foreign_keys=[usuario_id])