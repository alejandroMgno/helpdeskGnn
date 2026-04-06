from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class Marca(Base):
    __tablename__ = "marcas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)

class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    contacto = Column(String, nullable=True)

class Activo(Base):
    __tablename__ = "activos"
    id = Column(Integer, primary_key=True, index=True)
    etiqueta_gnn = Column(String, unique=True, index=True)
    nombre = Column(String)
    serie = Column(String, nullable=True)
    
    # Clasificación GNN: computadoras, celulares, lineas, perifericos
    categoria = Column(String) 
    
    marca_id = Column(Integer, ForeignKey("marcas.id"), nullable=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    status = Column(String, default="activo")
    
    factura_url = Column(String, nullable=True)
    responsiva_url = Column(String, nullable=True)
    
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

    usuario_asignado = relationship("Usuario", back_populates="activos")
    marca = relationship("Marca")
    proveedor = relationship("Proveedor")
    historial = relationship("HistorialActivo", back_populates="activo")
    mantenimientos = relationship("ProgramaMantenimiento", back_populates="activo")

class HistorialActivo(Base):
    __tablename__ = "historial_activos"
    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    departamento = Column(String)
    fecha_asignacion = Column(DateTime, default=datetime.utcnow)
    fecha_devolucion = Column(DateTime, nullable=True)
    observaciones = Column(Text, nullable=True)
    activo = relationship("Activo", back_populates="historial")

# --- NUEVO: MOTOR DE MANTENIMIENTO ---
class ProgramaMantenimiento(Base):
    __tablename__ = "programas_mantenimiento"
    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), index=True)
    frecuencia_meses = Column(Integer)
    fecha_inicio = Column(DateTime)
    proxima_fecha = Column(DateTime)
    is_active = Column(Boolean, default=True)
    activo = relationship("Activo", back_populates="mantenimientos")

class RegistroMantenimiento(Base):
    __tablename__ = "registros_mantenimiento"
    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), index=True)
    tecnico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_programada = Column(DateTime)
    fecha_ejecucion = Column(DateTime, nullable=True)
    status = Column(String, default="PENDIENTE") # PENDIENTE, COMPLETADO, REPROGRAMADO
    observaciones = Column(Text, nullable=True)