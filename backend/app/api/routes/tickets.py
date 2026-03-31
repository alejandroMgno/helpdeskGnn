from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.schemas.ticket import TicketCreate, TicketResponse
from app.models.ticket import Ticket
from app.services.sla_engine import asignar_tecnico_inteligente

router = APIRouter()

@router.post("/", response_model=TicketResponse)
def crear_ticket(ticket_in: TicketCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    nuevo_ticket = Ticket(**ticket_in.dict(), usuario_id=current_user.id)
    # Aplicar lógica de asignación automática
    nuevo_ticket = asignar_tecnico_inteligente(db, nuevo_ticket)
    
    db.add(nuevo_ticket)
    db.commit()
    db.refresh(nuevo_ticket)
    return nuevo_ticket