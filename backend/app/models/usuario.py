from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.base_class import Base

# Roles del sistema
class RolUsuario(str, enum.Enum):
    Admin = "Admin"
    Tecnico = "Tecnico"
    Especialista = "Especialista"
    Usuario = "Usuario"

# Estatus de cuenta
class EstatusUsuario(str, enum.Enum):
    Activo = "Activo"
    Inactivo = "Inactivo"

# Disponibilidad técnica
class StatusTecnico(str, enum.Enum):
    Activo = "Activo"
    Ocupado = "Ocupado"
    Comiendo = "Comiendo"
    Ausente = "Ausente"
    Fuera_de_Oficina = "Fuera_de_Oficina"
    Vacaciones = "Vacaciones"

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    
    rol = Column(SQLEnum(RolUsuario), default=RolUsuario.Usuario)
    zona = Column(String(50), nullable=True)
    departamento = Column(String(50), nullable=True)
    centro_costo = Column(String(50), nullable=True)
    
    # --- NUEVOS CAMPOS ORGANIZACIONALES ---
    empresa = Column(String(100), nullable=True)
    no_empleado = Column(String(50), nullable=True)
    fecha_ingreso = Column(DateTime, nullable=True)
    subdepartamento = Column(String(100), nullable=True)
    puesto = Column(String(100), nullable=True)
    proyecto = Column(String(100), nullable=True)
    ciudad = Column(String(100), nullable=True)
    estado = Column(String(100), nullable=True)
    razon_social = Column(String(200), nullable=True)
    registro_patronal = Column(String(100), nullable=True)
    razon_social_pagadora = Column(String(200), nullable=True)
    no_banca = Column(String(100), nullable=True)
    banco_pagador = Column(String(100), nullable=True)
    
    # --- NUEVOS CAMPOS PERSONALES ---
    correo_personal = Column(String(100), nullable=True)
    celular_personal = Column(String(20), nullable=True)
    celular_red = Column(String(20), nullable=True)
    imss = Column(String(50), nullable=True)
    rfc = Column(String(20), nullable=True)
    curp = Column(String(20), nullable=True)
    fecha_nacimiento = Column(DateTime, nullable=True)
    edad = Column(Integer, nullable=True)
    sexo = Column(String(20), nullable=True)

    # 🔥 Cambiado a 'estatus' para coincidir con tu auth
    estatus = Column(SQLEnum(EstatusUsuario), default=EstatusUsuario.Activo)
    
    # Flag de vacaciones
    ausente = Column(Boolean, default=False)
    
    # Campo para avatar
    avatar_url = Column(String(255), nullable=True)

    # Enrutamiento de técnicos
    tecnico_principal_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    tecnico_secundario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Indica si este técnico es el que está de guardia actualmente
    is_tecnico_principal = Column(Boolean, default=False)

    tecnico_principal = relationship(
        "Usuario", 
        remote_side=[id], 
        foreign_keys=[tecnico_principal_id],
        backref="usuarios_asignados_principal"
    )
    tecnico_secundario = relationship(
        "Usuario", 
        remote_side=[id], 
        foreign_keys=[tecnico_secundario_id],
        backref="usuarios_asignados_secundario"
    )

    # Disponibilidad técnica
    status_tecnico = Column(SQLEnum(StatusTecnico), default=StatusTecnico.Ausente)

    especialidad = Column(String(100), nullable=True) # "Desarrollo", "Infraestructura", "Redes" o None/Soporte

    debe_cambiar_password = Column(Boolean, default=False)

    is_active = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Horarios laborales
    horarios = relationship("HorarioLaboral", back_populates="usuario", cascade="all, delete-orphan")

class HorarioLaboral(Base):
    __tablename__ = "horarios_laborales"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    dia_semana = Column(Integer, nullable=False) # 0=Lunes, 6=Domingo
    es_laboral = Column(Boolean, default=True)
    hora_inicio_1 = Column(String(5), nullable=True) # "09:00"
    hora_fin_1 = Column(String(5), nullable=True)    # "14:00"
    hora_inicio_2 = Column(String(5), nullable=True) # "15:00"
    hora_fin_2 = Column(String(5), nullable=True)    # "18:00"

    usuario = relationship("Usuario", back_populates="horarios")
