from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base_class import Base

class RolUsuario(str, enum.Enum):
    ADMIN = "admin"
    TECNICO = "tecnico"
    NORMAL = "normal"

class StatusTecnico(str, enum.Enum):
    ACTIVO = "activo"
    OCUPADO = "ocupado"
    VACACIONES = "vacaciones"
    COMIENDO = "comiendo"
    FUERA = "fuera_oficina"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Roles y Ruteo
    rol = Column(Enum(RolUsuario), default=RolUsuario.NORMAL)
    status_tecnico = Column(Enum(StatusTecnico), default=StatusTecnico.ACTIVO)
    
    # Jerarquía GNN
    zona = Column(String, nullable=True) # Norte, Sur, Noroeste...
    departamento = Column(String, nullable=True)
    centro_costo = Column(String, nullable=True)
    
    # Perfil
    foto_perfil = Column(String, nullable=True)
    
    # Soft Delete
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

    # Relaciones
    activos = relationship("Activo", back_populates="usuario_asignado")
    tickets_creados = relationship("Ticket", foreign_keys="Ticket.creador_id", back_populates="creador")
    tickets_asignados = relationship("Ticket", foreign_keys="Ticket.tecnico_id", back_populates="tecnico")