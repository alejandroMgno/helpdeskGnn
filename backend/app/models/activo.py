from sqlalchemy import Column, String, Float, ForeignKey, Date, Text, Integer
from sqlalchemy.orm import relationship
from app.db.base_class import AuditBaseModel

class Activo(AuditBaseModel):
    __tablename__ = "activos"
    
    numero_serie = Column(String(100), unique=True, index=True)
    modelo = Column(String(150))
    marca = Column(String(100))
    proveedor = Column(String(100))
    costo = Column(Float)
    estatus_operativo = Column(String(50), default="En Almacén")
    
    usuario_asignado_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Relación opcional para consultas
    usuario_asignado = relationship("Usuario")