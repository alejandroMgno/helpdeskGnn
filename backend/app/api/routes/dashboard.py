# backend/app/api/routes/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario
from app.models.ticket import Ticket, EstatusTicket

router = APIRouter()

@router.get("/kpis")
def obtener_kpis_dashboard(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Devuelve los números duros para el Frontend dependiendo del rol"""
    
    if current_user.rol.value == "Admin":
        tickets_abiertos = db.query(Ticket).filter(Ticket.estatus != EstatusTicket.Cerrado).count()
        return {
            "rol": "Admin",
            "kpis": {
                "tickets_totales": tickets_abiertos,
                "en_riesgo_sla": 0, # Aquí luego cruzaremos con fechas
                "tecnicos_activos": db.query(Usuario).filter(Usuario.rol == "Tecnico").count()
            }
        }
        
    elif current_user.rol.value == "Tecnico":
        mis_tickets = db.query(Ticket).filter(
            Ticket.tecnico_asignado_id == current_user.id,
            Ticket.estatus != EstatusTicket.Cerrado
        ).count()
        return {
            "rol": "Tecnico",
            "kpis": {
                "mis_tickets_abiertos": mis_tickets,
            }
        }
        
    else:
        # Usuario Normal
        mis_tickets = db.query(Ticket).filter(Ticket.solicitante_id == current_user.id).count()
        return {
            "rol": "Usuario",
            "kpis": {
                "mis_tickets_reportados": mis_tickets,
            }
        }