from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class DocumentoLicencia(Base):
    __tablename__ = "documentos_licencias"

    id = Column(Integer, primary_key=True, index=True)
    licencia_id = Column(Integer, ForeignKey("licencias.id"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    tipo_documento = Column(String(50), nullable=True) # Factura, Contrato, etc.
    fecha_carga = Column(DateTime, default=datetime.utcnow)
    
    licencia = relationship("Licencia", back_populates="documentos_relacionados")
