from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base_class import Base

class HistorialStatusTecnico(Base):
    """Registra cuánto tiempo pasa un técnico en cada estado (Comida, Ausente, etc.)"""
    __tablename__ = "historial_status_tecnicos"

    id = Column(Integer, primary_key=True, index=True)
    tecnico_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    status_anterior = Column(String(50))
    status_nuevo = Column(String(50))
    fecha_cambio = Column(DateTime, default=datetime.utcnow)
    duracion_estimada_minutos = Column(Integer, nullable=True) # Para el temporizador
    
    tecnico = relationship("Usuario", foreign_keys=[tecnico_id])

class TicketTimeline(Base):
    """El historial visual del ticket (Estilo Uber/Pizza)"""
    __tablename__ = "ticket_timeline"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("tickets.id"), nullable=False)
    evento = Column(String(100)) # ej: 'Ticket Creado', 'Asignado a Juan', 'En Comida'
    descripcion = Column(Text)
    icon = Column(String(50)) # Para el frontend: 'pi pi-plus', 'pi pi-user'
    color = Column(String(20)) # #34d399, etc.
    fecha = Column(DateTime, default=datetime.utcnow)
    metadata_extra = Column(JSON, nullable=True) # Para guardar quién hizo el cambio
    
    ticket = relationship("Ticket", backref="timeline")
