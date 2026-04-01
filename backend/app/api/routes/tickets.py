from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.api.dependencies import get_db, get_current_user
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketResponse

router = APIRouter()

@router.post("/", response_model=TicketResponse)
def crear_ticket(
    ticket_in: TicketCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    # Lógica de SLA para GNN:
    # Prioridad Alta = 4 horas | Media = 12 horas | Baja = 24 horas
    tiempos = {"Alta": 4, "Media": 12, "Baja": 24}
    horas_gracia = tiempos.get(ticket_in.prioridad, 24)
    fecha_limite = datetime.now() + timedelta(hours=horas_gracia)

    nuevo_ticket = Ticket(
        **ticket_in.dict(),
        usuario_creador_id=current_user.id,
        fecha_limite_sla=fecha_limite,
        estado="Abierto"
    )
    
    db.add(nuevo_ticket)
    db.commit()
    db.refresh(nuevo_ticket)
    return nuevo_ticket

@router.get("/", response_model=List[TicketResponse])
def listar_tickets(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Ticket).all()