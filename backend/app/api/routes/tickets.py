from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from app.api.dependencies import get_db, get_current_user
from app.models.ticket import Ticket, PrioridadSLA, StatusTicket, ComentarioTicket
from app.models.usuario import Usuario, RolUsuario
from app.models.auditoria import RegistroAuditoria
from app.services.sla_engine import calcular_vencimiento_sla, asignar_tecnico_inteligente

router = APIRouter()

@router.get("/")
def listar_tickets(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    # Si es ADMIN ve todo, si es TECNICO ve los suyos y los no asignados, si es NORMAL ve solo los suyos
    if current_user.rol == RolUsuario.ADMIN:
        tickets = db.query(Ticket).order_by(desc(Ticket.fecha_creacion)).all()
    elif current_user.rol == RolUsuario.TECNICO:
        tickets = db.query(Ticket).filter((Ticket.tecnico_id == current_user.id) | (Ticket.tecnico_id == None)).order_by(desc(Ticket.fecha_creacion)).all()
    else:
        tickets = db.query(Ticket).filter(Ticket.creador_id == current_user.id).order_by(desc(Ticket.fecha_creacion)).all()
    
    return tickets

@router.get("/{ticket_id}")
def detalle_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Traer comentarios
    comentarios = db.query(ComentarioTicket).filter(ComentarioTicket.ticket_id == ticket_id).order_by(ComentarioTicket.fecha).all()
    
    return {
        "ticket": ticket,
        "creador": ticket.creador.nombre if ticket.creador else "Desconocido",
        "tecnico": ticket.tecnico.nombre if ticket.tecnico else "Sin Asignar",
        "comentarios": [{"id": c.id, "autor": c.autor_id, "texto": c.comentario, "fecha": c.fecha} for c in comentarios]
    }

@router.post("/")
def crear_ticket(ticket_in: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    try:
        prioridad_enum = PrioridadSLA(ticket_in.get("prioridad", "media"))
    except ValueError:
        prioridad_enum = PrioridadSLA.MEDIA

    vencimiento = calcular_vencimiento_sla(prioridad_enum)
    tecnico_asignado_id = asignar_tecnico_inteligente(db, zona_ticket=current_user.zona)

    nuevo_ticket = Ticket(
        titulo=ticket_in["titulo"],
        descripcion=ticket_in["descripcion"],
        prioridad=prioridad_enum,
        status=StatusTicket.ABIERTO,
        fecha_vencimiento_sla=vencimiento,
        creador_id=current_user.id,
        tecnico_id=tecnico_asignado_id
    )
    db.add(nuevo_ticket)
    db.commit()
    
    # Auditoría
    db.add(RegistroAuditoria(usuario_id=current_user.id, accion="CREAR_TICKET", tabla_afectada="tickets", registro_id=nuevo_ticket.id))
    db.commit()
    return {"message": "Ticket creado", "ticket_id": nuevo_ticket.id}

@router.post("/{ticket_id}/comentarios")
def agregar_comentario(ticket_id: int, comentario_in: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    nuevo_comentario = ComentarioTicket(
        ticket_id=ticket_id,
        autor_id=current_user.id,
        comentario=comentario_in["texto"]
    )
    db.add(nuevo_comentario)
    db.commit()
    return {"message": "Comentario agregado"}

@router.put("/{ticket_id}/status")
def cambiar_estatus(ticket_id: int, status_in: dict, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    nuevo_status = status_in.get("status")

    # Reglas de negocio GNN
    if nuevo_status == StatusTicket.CANCELADO and current_user.rol != RolUsuario.NORMAL and current_user.rol != RolUsuario.ADMIN:
        raise HTTPException(status_code=403, detail="Solo el usuario puede cancelar el ticket")
    
    if nuevo_status == StatusTicket.CERRADO and current_user.rol == RolUsuario.NORMAL:
        raise HTTPException(status_code=403, detail="Solo un técnico o admin puede cerrar el ticket")

    ticket.status = nuevo_status
    db.commit()
    
    db.add(RegistroAuditoria(usuario_id=current_user.id, accion=f"CAMBIO_STATUS_A_{nuevo_status.upper()}", tabla_afectada="tickets", registro_id=ticket.id))
    db.commit()
    return {"message": f"Estatus actualizado a {nuevo_status}"}