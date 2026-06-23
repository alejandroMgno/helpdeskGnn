# backend/app/schemas/ticket.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.ticket import PrioridadTicket, EstatusTicket

# 1. NUEVO: Creamos un mini-esquema para la info del Solicitante
class SolicitanteInfo(BaseModel):
    nombre_completo: str
    departamento: Optional[str] = None
    zona: Optional[str] = None

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    titulo: str
    descripcion: str
    prioridad: PrioridadTicket = PrioridadTicket.Media
    departamento: Optional[str] = "Soporte N1"
    activo_id: Optional[int] = None

class TicketCreate(TicketBase):
    pass

class TicketUpdate(BaseModel):
    estatus: Optional[EstatusTicket] = None
    prioridad: Optional[PrioridadTicket] = None
    departamento: Optional[str] = None
    tecnico_asignado_id: Optional[int] = None

class TicketResponse(TicketBase):
    id: int
    estatus: EstatusTicket
    fecha_creacion: datetime
    fecha_vencimiento_sla: Optional[datetime] = None
    fecha_primera_respuesta: Optional[datetime] = None
    fecha_resolucion: Optional[datetime] = None
    tiempo_pausado_acumulado: int = 0
    ultima_fecha_pausa: Optional[datetime] = None
    solicitante_id: int
    tecnico_asignado_id: Optional[int] = None
    
    # Indicador de cumplimiento (0-100% o >100% si vencido)
    sla_cumplimiento_porcentaje: Optional[float] = None
    sla_estado_visual: Optional[str] = None # 'verde', 'amarillo', 'rojo', 'vencido'
    
    # 2. NUEVO: Le decimos a Pydantic que extraiga el objeto 'solicitante' de la Base de Datos
    solicitante: SolicitanteInfo
    tecnico: Optional[SolicitanteInfo] = None

    class Config:
        from_attributes = True