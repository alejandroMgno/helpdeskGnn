from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timedelta
from app.db.base_class import Base

class PrioridadTicket(str, enum.Enum):
    Critica = "Crítica 2h"
    Alta = "Alta 8h"
    Media = "Media 24h"
    Baja = "Baja 72h"

class EstatusTicket(str, enum.Enum):
    Abierto = "Abierto"
    En_Progreso = "En Progreso"
    Resuelto = "Resuelto"
    Cerrado = "Cerrado"
    Cancelado = "Cancelado"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    prioridad = Column(Enum(PrioridadTicket), default=PrioridadTicket.Media)
    estatus = Column(Enum(EstatusTicket), default=EstatusTicket.Abierto)
    departamento = Column(String(100), default="Soporte N1")
    activo_id = Column(String(100), nullable=True)
    
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_vencimiento_sla = Column(DateTime, nullable=False)
    
    solicitante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tecnico_asignado_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    solicitante = relationship("Usuario", foreign_keys=[solicitante_id])
    comentarios = relationship("Comentario", back_populates="ticket", cascade="all, delete-orphan")

class Comentario(Base):
    __tablename__ = "comentarios"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    autor_id = Column(Integer, ForeignKey("usuarios.id"))
    texto = Column(Text, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="comentarios")
    autor = relationship("Usuario")