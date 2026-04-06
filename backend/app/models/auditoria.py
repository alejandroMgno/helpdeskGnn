from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from datetime import datetime
from app.db.base_class import Base

class RegistroAuditoria(Base):
    __tablename__ = "auditoria"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, index=True) # Quien hizo la acción
    accion = Column(String) # EJ: "CREAR_TICKET", "ASIGNAR_ACTIVO", "SOFT_DELETE_USUARIO"
    tabla_afectada = Column(String)
    registro_id = Column(Integer) # ID del activo/ticket modificado
    detalles_previos = Column(JSON, nullable=True) # Cómo estaba antes
    detalles_nuevos = Column(JSON, nullable=True)  # Cómo quedó
    fecha = Column(DateTime, default=datetime.utcnow)
    ip_origen = Column(String, nullable=True)