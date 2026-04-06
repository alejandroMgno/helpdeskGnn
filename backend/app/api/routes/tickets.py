# backend/app/api/routes/tickets.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketResponse
from app.services.sla_engine import calcular_vencimiento_sla, asignar_tecnico_inteligente

router = APIRouter()

@router.post("/", response_model=TicketResponse)
def crear_ticket(
    ticket_in: TicketCreate, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_user)
):
    """Crea un nuevo ticket y asigna automáticamente el técnico y el SLA."""
    
    tecnico_id = asignar_tecnico_inteligente(db, current_user.id)
    vencimiento = calcular_vencimiento_sla(ticket_in.prioridad.value)

    nuevo_ticket = Ticket(
        titulo=ticket_in.titulo,
        descripcion=ticket_in.descripcion,
        prioridad=ticket_in.prioridad,
        solicitante_id=current_user.id,
        tecnico_asignado_id=tecnico_id,
        fecha_vencimiento_sla=vencimiento
    )
    
    db.add(nuevo_ticket)
    db.commit()
    db.refresh(nuevo_ticket)
    return nuevo_ticket

@router.get("/", response_model=List[TicketResponse])
def listar_tickets(
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_user)
):
    """Lista los tickets. Si es admin, ve todos. Si es usuario/técnico, ve los suyos."""
    if current_user.rol.value == "Admin":
        tickets = db.query(Ticket).all()
    else:
        # Ve los que creó o los que le asignaron
        tickets = db.query(Ticket).filter(
            (Ticket.solicitante_id == current_user.id) | 
            (Ticket.tecnico_asignado_id == current_user.id)
        ).all()
    return tickets