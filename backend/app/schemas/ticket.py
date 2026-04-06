# backend/app/schemas/ticket.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.ticket import PrioridadTicket, EstatusTicket

class TicketBase(BaseModel):
    titulo: str
    descripcion: str
    prioridad: PrioridadTicket = PrioridadTicket.Media

class TicketCreate(TicketBase):
    pass

class TicketResponse(TicketBase):
    id: int
    estatus: EstatusTicket
    fecha_creacion: datetime
    fecha_vencimiento_sla: datetime
    solicitante_id: int
    tecnico_asignado_id: Optional[int] = None

    class Config:
        from_attributes = True