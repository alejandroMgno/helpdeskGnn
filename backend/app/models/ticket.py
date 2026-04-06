from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
from app.db.base_class import Base

class PrioridadSLA(str, enum.Enum):
    CRITICA = "critica" # 2h
    ALTA = "alta"       # 8h
    MEDIA = "media"     # 24h
    BAJA = "baja"       # 72h

class StatusTicket(str, enum.Enum):
    ABIERTO = "abierto"
    EN_PROGRESO = "en_progreso"
    ESPERA_USUARIO = "espera_usuario"
    CERRADO = "cerrado"
    CANCELADO = "cancelado"

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String, index=True)
    descripcion = Column(Text)
    
    # SLA y Status
    prioridad = Column(Enum(PrioridadSLA), default=PrioridadSLA.MEDIA)
    status = Column(Enum(StatusTicket), default=StatusTicket.ABIERTO)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_vencimiento_sla = Column(DateTime) # Se calcula en el endpoint
    fecha_cierre = Column(DateTime, nullable=True)
    
    # Evidencia
    imagen_referencia_url = Column(String, nullable=True)
    
    # Usuarios involucrados
    creador_id = Column(Integer, ForeignKey("usuarios.id"))
    tecnico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Relaciones
    creador = relationship("Usuario", foreign_keys=[creador_id], back_populates="tickets_creados")
    tecnico = relationship("Usuario", foreign_keys=[tecnico_id], back_populates="tickets_asignados")
    comentarios = relationship("ComentarioTicket", back_populates="ticket")

class ComentarioTicket(Base):
    __tablename__ = "comentarios_ticket"
    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"))
    autor_id = Column(Integer, ForeignKey("usuarios.id"))
    comentario = Column(Text)
    imagen_url = Column(String, nullable=True)
    fecha = Column(DateTime, default=datetime.utcnow)
    
    ticket = relationship("Ticket", back_populates="comentarios")