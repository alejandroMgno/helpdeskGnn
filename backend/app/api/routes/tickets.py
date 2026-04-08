# backend/app/api/routes/tickets.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.ticket import Ticket, EstatusTicket, Comentario

router = APIRouter()

@router.get("/{ticket_id}/comentarios")
def obtener_comentarios(ticket_id: int, db: Session = Depends(get_db)):
    coms = db.query(Comentario).filter(Comentario.ticket_id == ticket_id).all()
    return [{
        "id": c.id,
        "autor": c.autor.nombre_completo,
        "rol": c.autor.rol,
        "texto": c.texto,
        "fecha": c.fecha.strftime("%d %b, %I:%M %p"),
        "avatar": f"https://ui-avatars.com/api/?name={c.autor.nombre_completo}",
        "adjunto_url": c.adjunto_url,  # Soporte para imágenes
        "adjunto_nombre": c.adjunto_nombre
    } for c in coms]

@router.put("/{ticket_id}/estatus")
def actualizar_estatus(
    ticket_id: int, 
    nuevo_estatus: str = Body(..., embed=True), 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket: raise HTTPException(404, "Ticket no encontrado")
    
    ticket.estatus = nuevo_estatus
    
    # Registro automático en el chat
    log = Comentario(
        ticket_id=ticket_id,
        autor_id=current_user.id,
        texto=f"SISTEMA: Estatus cambiado a {nuevo_estatus}",
    )
    db.add(log)
    db.commit()
    return {"status": "updated"}

@router.post("/{ticket_id}/comentarios")
def agregar_comentario(
    ticket_id: int, 
    data: dict, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_user)
):
    nuevo = Comentario(
        ticket_id=ticket_id, 
        autor_id=current_user.id, 
        texto=data.get('texto', ''),
        adjunto_url=data.get('adjunto_url'), # Guardamos la URL de la imagen
        adjunto_nombre=data.get('adjunto_nombre')
    )
    db.add(nuevo)
    db.commit()
    return {"status": "ok"}