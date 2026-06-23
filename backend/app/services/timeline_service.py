from sqlalchemy.orm import Session
from app.models.seguimiento import TicketTimeline
from typing import Optional, Any
from fastapi.encoders import jsonable_encoder

def registrar_evento_timeline(
    db: Session, 
    ticket_id: int, 
    evento: str, 
    descripcion: str, 
    icon: str = "pi pi-info-circle", 
    color: str = "#6366f1",
    metadata_extra: Optional[Any] = None
):
    """Agrega un hito al historial visual del ticket."""
    nuevo_hito = TicketTimeline(
        ticket_id=ticket_id,
        evento=evento,
        descripcion=descripcion,
        icon=icon,
        color=color,
        metadata_extra=jsonable_encoder(metadata_extra) if metadata_extra is not None else None
    )
    db.add(nuevo_hito)
    db.commit()
