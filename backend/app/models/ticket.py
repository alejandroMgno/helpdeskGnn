from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timedelta
from app.db.base_class import Base

class PrioridadTicket(str, enum.Enum):
    Critica = "Crítica"
    Alta = "Alta"
    Media = "Media"
    Baja = "Baja"

class EstatusTicket(str, enum.Enum):
    Abierto = "Abierto"
    En_Progreso = "En Progreso"
    En_Espera_Pieza = "En Espera de Pieza"
    En_Espera_Reunion = "En Espera de Reunión"
    Resuelto = "Resuelto"
    Cerrado = "Cerrado"
    Cancelado = "Cancelado"
    Escalado_Desarrollo = "Escalado a Desarrollo"
    Escalado_Infraestructura = "Escalado a Infraestructura"
    Escalado_Redes = "Escalado a Redes"

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
    fecha_vencimiento_sla = Column(DateTime, nullable=True) # Puede ser nulo hasta la primera respuesta
    fecha_primera_respuesta = Column(DateTime, nullable=True)
    fecha_resolucion = Column(DateTime, nullable=True)
    
    # Control de pausas
    tiempo_pausado_acumulado = Column(Integer, default=0) # Segundos acumulados
    ultima_fecha_pausa = Column(DateTime, nullable=True)
    
    solicitante_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    tecnico_asignado_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Calificación de satisfacción
    satisfaccion_estrellas = Column(Integer, nullable=True)
    satisfaccion_comentario = Column(Text, nullable=True)
    
    reabierto = Column(Boolean, default=False)
    notificado_recordatorio_cierre = Column(Boolean, default=False)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Escalación de tickets
    parent_ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=True)
    is_escalation = Column(Boolean, default=False)

    solicitante = relationship("Usuario", foreign_keys=[solicitante_id])
    tecnico = relationship("Usuario", foreign_keys=[tecnico_asignado_id])
    parent_ticket = relationship("Ticket", remote_side=[id], backref="child_tickets")
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