from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Marca(Base):
    __tablename__ = "marcas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    descripcion = Column(String(255), nullable=True)

class Proveedor(Base):
    __tablename__ = "proveedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), unique=True, index=True, nullable=False)
    rfc = Column(String(20), nullable=True)
    contacto_nombre = Column(String(150), nullable=True)
    contacto_telefono = Column(String(50), nullable=True)
    contacto_email = Column(String(150), nullable=True)
    notas = Column(String(500), nullable=True)

class SLAConfig(Base):
    __tablename__ = "sla_configs"
    id = Column(Integer, primary_key=True, index=True)
    prioridad = Column(String(50), unique=True, index=True, nullable=False) # Critica, Alta, Media, Baja
    horas = Column(Integer, nullable=False)
    descripcion = Column(String(255), nullable=True)

class CategoriaActivo(Base):
    __tablename__ = "categorias_activos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    icono = Column(String(50), nullable=True, default="pi pi-box") # Icono de PrimeIcons o similar

# --- NUEVOS CATÁLOGOS ORGANIZACIONALES ---

class Zona(Base):
    __tablename__ = "zonas"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, index=True, nullable=False)
    departamentos = relationship("Departamento", back_populates="zona")

class CentroCosto(Base):
    __tablename__ = "centros_costo"
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, index=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    departamentos = relationship("Departamento", back_populates="centro_costo")

class Departamento(Base):
    __tablename__ = "departamentos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), index=True, nullable=False)
    zona_id = Column(Integer, ForeignKey("zonas.id"))
    centro_costo_id = Column(Integer, ForeignKey("centros_costo.id"))
    
    zona = relationship("Zona", back_populates="departamentos")
    centro_costo = relationship("CentroCosto", back_populates="departamentos")

class Puesto(Base):
    __tablename__ = "puestos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), unique=True, index=True, nullable=False)

class ModeloParte(Base):
    __tablename__ = "modelo_partes"
    id = Column(Integer, primary_key=True, index=True)
    numero_parte = Column(String(100), unique=True, index=True, nullable=False)
    nombre = Column(String(150), nullable=False)
    descripcion = Column(String(500), nullable=True)
    marca_id = Column(Integer, ForeignKey("marcas.id"), nullable=True)
    tipo = Column(String(100), nullable=True) # Hace match con TipoActivo
    
    # Especificaciones para autorellenado
    ram = Column(String(50), nullable=True)
    cpu = Column(String(100), nullable=True)
    almacenamiento = Column(String(50), nullable=True)
    pulgadas = Column(String(20), nullable=True)
    rma = Column(String(100), nullable=True) # Campo solicitado
    
    # NUEVO: Para características dinámicas (toner, resolución, DPI, etc.)
    especificaciones_json = Column(JSON, nullable=True)

    marca = relationship("Marca")

