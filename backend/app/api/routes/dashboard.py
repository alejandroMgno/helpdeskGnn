from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.api.dependencies import get_db
from app.models.ticket import Ticket

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Conteo por prioridad para la dona
    stats = db.query(Ticket.sla_prioridad, func.count(Ticket.id)).group_by(Ticket.sla_prioridad).all()
    
    # Estructura para el frontend
    prioridades = [{"name": p, "value": c} for p, c in stats]
    total = sum(item["value"] for item in prioridades)
    
    return {
        "total_tickets": total,
        "grafica_prioridad": prioridades,
        "grafica_sla": [
            {"dia": "Hoy", "cumplimiento": 95, "tickets": total}
        ]
    }