# backend/app/models/usuario.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.db.base_class import Base

class RolUsuario(str, enum.Enum):
    Admin = "Admin"
    Tecnico = "Tecnico"
    Usuario = "Usuario"

class EstatusUsuario(str, enum.Enum):
    Activo = "Activo"
    Inactivo = "Inactivo"

# ¡Añadido para que tu sla_engine.py funcione!
class StatusTecnico(str, enum.Enum):
    Activo = "Activo"
    Ocupado = "Ocupado"
    Comiendo = "Comiendo"
    Vacaciones = "Vacaciones"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(150), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Estructura Organizacional
    zona = Column(String(100), nullable=True)
    departamento = Column(String(100), nullable=True)
    centro_costo = Column(String(50), nullable=True)
    
    # Permisos y Estado
    rol = Column(Enum(RolUsuario), default=RolUsuario.Usuario)
    estatus = Column(Enum(EstatusUsuario), default=EstatusUsuario.Activo)
    status_tecnico = Column(Enum(StatusTecnico), default=StatusTecnico.Activo, nullable=True)
    fecha_ingreso = Column(Date, default=datetime.utcnow)
    
    # SLA: Relación auto-referencial
    tecnico_base_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    tecnico_secundario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    tecnico_base = relationship("Usuario", foreign_keys=[tecnico_base_id], remote_side=[id])
    tecnico_secundario = relationship("Usuario", foreign_keys=[tecnico_secundario_id], remote_side=[id])