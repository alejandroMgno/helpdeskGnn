from sqlalchemy import Column, String, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.base_class import AuditBaseModel

class Ticket(AuditBaseModel):
    __tablename__ = "tickets"
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    sla_prioridad = Column(String(20), nullable=False) # Critica, Alta, Media, Baja
    estatus = Column(String(20), default="Abierto")    # Abierto, En Proceso, Cerrado, Cancelado
    
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tecnico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    tecnico = relationship("Usuario", foreign_keys=[tecnico_id])