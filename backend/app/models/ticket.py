# backend/app/models/ticket.py
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from app.db.base_class import Base

class PrioridadTicket(str, enum.Enum):
    Critica = "Crítica"
    Alta = "Alta"
    Media = "Media"
    Baja = "Baja"

class EstatusTicket(str, enum.Enum):
    Abierto = "Abierto"
    En_Progreso = "En Progreso"
    Escalado = "Escalado"
    Resuelto = "Resuelto"
    Cerrado = "Cerrado"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    
    prioridad = Column(Enum(PrioridadTicket), default=PrioridadTicket.Media)
    estatus = Column(Enum(EstatusTicket), default=EstatusTicket.Abierto)
    
    # Tiempos y SLA
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    fecha_vencimiento_sla = Column(DateTime, nullable=False)
    fecha_resolucion = Column(DateTime, nullable=True)
    
    # Relaciones
    solicitante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tecnico_asignado_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # ORM
    solicitante = relationship("Usuario", foreign_keys=[solicitante_id])
    tecnico_asignado = relationship("Usuario", foreign_keys=[tecnico_asignado_id])