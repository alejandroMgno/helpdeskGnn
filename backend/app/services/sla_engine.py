# backend/app/services/sla_engine.py
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.usuario import Usuario, StatusTecnico
from app.models.ticket import PrioridadTicket # Importamos tu Enum real

from app.models.catalogos import SLAConfig

def pausar_sla(ticket):
    """Registra el inicio de una pausa en el SLA del ticket."""
    if not ticket.ultima_fecha_pausa:
        ticket.ultima_fecha_pausa = datetime.utcnow()

def reanudar_sla(ticket):
    """Calcula y suma el tiempo de pausa al vencimiento del SLA."""
    if ticket.ultima_fecha_pausa:
        tiempo_transcurrido = datetime.utcnow() - ticket.ultima_fecha_pausa
        segundos_pausa = int(tiempo_transcurrido.total_seconds())
        
        ticket.tiempo_pausado_acumulado += segundos_pausa
        
        if ticket.fecha_vencimiento_sla:
            ticket.fecha_vencimiento_sla += timedelta(seconds=segundos_pausa)
            
        ticket.ultima_fecha_pausa = None

def calcular_vencimiento_sla(prioridad: PrioridadTicket, start_date: datetime = None, db: Session = None) -> datetime:
    """Calcula la fecha de vencimiento basada en la prioridad y configuración de BD."""
    horas_asignadas = 24
    
    if db:
        config = db.query(SLAConfig).filter(SLAConfig.prioridad == prioridad.value).first()
        if config:
            horas_asignadas = config.horas
        else:
            # Fallback hardcoded
            horas_sla = {
                PrioridadTicket.Critica: 2,
                PrioridadTicket.Alta: 8,
                PrioridadTicket.Media: 24,
                PrioridadTicket.Baja: 72
            }
            horas_asignadas = horas_sla.get(prioridad, 24)
    else:
        # Si no hay DB, usar defaults
        horas_sla = {
            PrioridadTicket.Critica: 2,
            PrioridadTicket.Alta: 8,
            PrioridadTicket.Media: 24,
            PrioridadTicket.Baja: 72
        }
        horas_asignadas = horas_sla.get(prioridad, 24)
    
    base_date = start_date if start_date else datetime.now(timezone.utc)
    
    if base_date.tzinfo is None:
        base_date = base_date.replace(tzinfo=timezone.utc)
        
    return base_date + timedelta(hours=horas_asignadas)

def asignar_tecnico_inteligente(db: Session, solicitante_id: int) -> int | None:
    """
    Intenta asignar al técnico base. Si está inactivo, ocupado, comiendo o de vacaciones, 
    busca al de respaldo. Si no hay ninguno, lo manda a la cola general (None).
    """
    solicitante = db.query(Usuario).filter(Usuario.id == solicitante_id).first()
    if not solicitante:
        return None

    # 1. Intentar con el Técnico Base
    if solicitante.tecnico_principal_id:
        titular = db.query(Usuario).filter(Usuario.id == solicitante.tecnico_principal_id).first()
        if titular and titular.status_tecnico == StatusTecnico.Activo:
            return titular.id

    # 2. Intentar con el Técnico de Respaldo
    if solicitante.tecnico_secundario_id:
        respaldo = db.query(Usuario).filter(Usuario.id == solicitante.tecnico_secundario_id).first()
        if respaldo and respaldo.status_tecnico == StatusTecnico.Activo:
            return respaldo.id

    # 3. Nadie disponible (se queda en la cola sin asignar para que un Admin lo tome)
    return None