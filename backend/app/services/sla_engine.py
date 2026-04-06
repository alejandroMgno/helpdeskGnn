from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ticket import PrioridadSLA, Ticket, StatusTicket
from app.models.usuario import Usuario, RolUsuario, StatusTecnico

# Diccionario de horas según el SLA que pediste
SLA_HORAS = {
    PrioridadSLA.CRITICA: 2,
    PrioridadSLA.ALTA: 8,
    PrioridadSLA.MEDIA: 24,
    PrioridadSLA.BAJA: 72
}

def calcular_vencimiento_sla(prioridad: PrioridadSLA) -> datetime:
    """Calcula la fecha límite de resolución del ticket basado en su prioridad"""
    horas = SLA_HORAS.get(prioridad, 24) # Por defecto 24h
    # Aquí en un futuro podemos agregar lógica para saltar fines de semana o fuera de horario
    return datetime.utcnow() + timedelta(hours=horas)

def asignar_tecnico_inteligente(db: Session, zona_ticket: str = None) -> int:
    """
    Encuentra al técnico ideal:
    1. Que esté ACTIVO (ni comiendo, ni de vacaciones)
    2. Que tenga la menor cantidad de tickets abiertos
    3. (Opcional) Que sea de la misma zona
    """
    # Buscar técnicos disponibles
    query = db.query(Usuario).filter(
        Usuario.rol == RolUsuario.TECNICO,
        Usuario.status_tecnico == StatusTecnico.ACTIVO,
        Usuario.is_deleted == False
    )

    if zona_ticket:
        # Si la empresa es muy grande, priorizamos técnicos de la misma zona (Norte, Sur, Noroeste)
        tecnicos_zona = query.filter(Usuario.zona == zona_ticket).all()
        tecnicos_disponibles = tecnicos_zona if tecnicos_zona else query.all()
    else:
        tecnicos_disponibles = query.all()

    if not tecnicos_disponibles:
        return None # No hay nadie disponible, se queda en la bolsa general (Sin asignar)

    # Buscar el que tenga menos carga de trabajo (tickets abiertos o en progreso)
    tecnico_ideal = None
    menor_carga = float('inf')

    for tecnico in tecnicos_disponibles:
        carga = db.query(func.count(Ticket.id)).filter(
            Ticket.tecnico_id == tecnico.id,
            Ticket.status.in_([StatusTicket.ABIERTO, StatusTicket.EN_PROGRESO])
        ).scalar()

        if carga < menor_carga:
            menor_carga = carga
            tecnico_ideal = tecnico

    return tecnico_ideal.id if tecnico_ideal else None