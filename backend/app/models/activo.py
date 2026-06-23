from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float, DateTime, JSON, Table # <-- Agregamos Table
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.db.base_class import Base

# Tabla de asociación para la relación Muchos a Muchos entre Activos y Licencias
activo_licencia = Table(
    "activo_licencia",
    Base.metadata,
    Column("activo_id", Integer, ForeignKey("activos.id"), primary_key=True),
    Column("licencia_id", Integer, ForeignKey("licencias.id"), primary_key=True)
)

class TipoActivo(enum.Enum):

    Computo = "Equipo de Cómputo"
    Licencia = "Licencia de Software"
    Periferico = "Periférico"
    Red = "Equipo de Red"
    Celular = "Celular"

class EstatusActivo(str, enum.Enum):
    Asignado = "Asignado"
    Disponible = "Disponible"
    Mantenimiento = "En Mantenimiento"
    Baja = "Dado de Baja"
    Obsoleto = "Obsoleto"
    BajaDefinitiva = "Baja Definitiva"

class Activo(Base):
    __tablename__ = "activos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True, nullable=False) # Ej. LAP-001
    numero_parte = Column(String(100), index=True, nullable=True)
    modelo_parte_id = Column(Integer, ForeignKey("modelo_partes.id"), nullable=True)
    nombre = Column(String(150), nullable=False) # Modelo o Nombre del equipo
    modelo = Column(String(100), nullable=True)
    marca_texto = Column(String(100), nullable=True)
    marca_id = Column(Integer, ForeignKey("marcas.id"), nullable=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    tipo = Column(Enum(TipoActivo), default=TipoActivo.Computo)
    estatus = Column(Enum(EstatusActivo), default=EstatusActivo.Disponible)

    # Datos de Baja
    motivo_baja = Column(String(100), nullable=True)
    fecha_baja = Column(DateTime, nullable=True)

    # Especificaciones Técnicas
    imei = Column(String(50), nullable=True)
    chip = Column(String(50), nullable=True)
    serie = Column(String(100), nullable=True)
    ram = Column(String(50), nullable=True)
    cpu = Column(String(100), nullable=True)
    pulgadas = Column(String(20), nullable=True)
    almacenamiento = Column(String(50), nullable=True)
    formato = Column(String(50), nullable=True) # Laptop, Desktop, Tablet, etc.
    rma = Column(String(100), nullable=True)

    # Datos Financieros y Documentación
    costo = Column(Float, default=0.0)
    factura_numero = Column(String(100), nullable=True)
    documentos = Column(JSON, default=list)
    fecha_compra = Column(DateTime, default=datetime.utcnow)
    anios_garantia = Column(Integer, default=1)

    # Mantenimiento y Salud
    fecha_ultimo_mantenimiento = Column(DateTime, nullable=True)
    meses_mantenimiento = Column(Integer, default=6)
    fecha_proximo_mantenimiento = Column(DateTime, nullable=True)

    # Otros
    historial = Column(JSON, default=list)
    is_deleted = Column(Integer, default=0)

    # A quién pertenece este equipo
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Relaciones ORM
    usuario = relationship("Usuario", backref="activos_asignados")
    marca = relationship("Marca", backref="activos")
    proveedor = relationship("Proveedor", backref="activos")
    modelo_parte = relationship("ModeloParte")
    mantenimientos = relationship("Mantenimiento", back_populates="activo", cascade="all, delete-orphan")
    licencias = relationship("Licencia", secondary=activo_licencia, back_populates="activos")

class Mantenimiento(Base):
    __tablename__ = "mantenimientos"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), nullable=False)
    tecnico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow)
    tipo = Column(String(50)) # Preventivo, Correctivo, Mejora
    descripcion = Column(String(500))
    costo = Column(Float, default=0.0)
    notas_internas = Column(String(500), nullable=True)

    activo = relationship("Activo", back_populates="mantenimientos")
    tecnico = relationship("Usuario")