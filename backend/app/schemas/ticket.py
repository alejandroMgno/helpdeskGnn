from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TicketBase(BaseModel):
    titulo: str
    descripcion: str
    sla_prioridad: str

class TicketCreate(TicketBase):
    pass

class TicketResponse(TicketBase):
    id: int
    estatus: str
    usuario_id: int
    tecnico_id: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True