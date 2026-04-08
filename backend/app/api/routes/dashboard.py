# backend/app/api/routes/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario, RolUsuario, StatusTecnico
from app.models.ticket import Ticket, EstatusTicket

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # 1. KPIs Globales (Para el Admin)
    total_tickets = db.query(Ticket).count()
    
    # Contar técnicos online con tus Enums correctos
    tecnicos_online = db.query(Usuario).filter(
        Usuario.rol == RolUsuario.Tecnico, 
        Usuario.status_tecnico == StatusTecnico.Activo
    ).count()
    
    total_tecnicos = db.query(Usuario).filter(Usuario.rol == RolUsuario.Tecnico).count()
    
    # 2. KPIs Personales (Para el Técnico)
    # ¡AQUÍ ESTABA EL ERROR! Usamos tu columna real: tecnico_asignado_id
    mis_tickets_activos = db.query(Ticket).filter(
        Ticket.tecnico_asignado_id == current_user.id, 
        Ticket.estatus != EstatusTicket.Cerrado
    ).count()
    
    mis_tickets_resueltos = db.query(Ticket).filter(
        Ticket.tecnico_asignado_id == current_user.id, 
        Ticket.estatus == EstatusTicket.Cerrado
    ).count()

    # 3. KPIs del Usuario Normal
    # ¡AQUÍ ESTABA EL OTRO ERROR! Usamos tu columna real: solicitante_id
    mis_solicitudes = db.query(Ticket).filter(
        Ticket.solicitante_id == current_user.id, 
        Ticket.estatus != EstatusTicket.Cerrado
    ).count()

    # Estructura JSON para que el Frontend la lea perfectamente
    stats = {
        "admin": {
            "ticketsTotales": total_tickets,
            "criticosSLA": 0, 
            "tecnicosOnline": tecnicos_online,
            "tecnicosTotal": total_tecnicos,
            "disponibilidad": 99.8,
            "ticketsRiesgo": [],
            "tecnicos": []
        },
        "tecnico": {
            "activos": mis_tickets_activos,
            "resueltos": mis_tickets_resueltos,
            "sla": "100%",
            "vencimientos": []
        },
        "usuario": {
            "solicitudes": mis_solicitudes,
            "equipos": 0, 
            "estatus": "Sin Alertas"
        }
    }
    
    return stats