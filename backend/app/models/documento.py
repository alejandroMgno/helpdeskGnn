from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class DocumentoActivo(Base):
    __tablename__ = "documentos_activos"

    id = Column(Integer, primary_key=True, index=True)
    activo_id = Column(Integer, ForeignKey("activos.id"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    tipo_documento = Column(String(50), nullable=True) # Factura, Manual, Garantia, etc.
    categoria = Column(String(50), nullable=True) # Resguardo, Otro
    is_signed = Column(Boolean, default=False)
    fecha_carga = Column(DateTime, default=datetime.utcnow)
    
    activo = relationship("Activo", back_populates="documentos_relacionados")
