# backend/app/services/sla_engine.py
from datetime import datetime, timedelta, timezone, time
from sqlalchemy.orm import Session
from app.models.usuario import Usuario, StatusTecnico
from app.models.ticket import PrioridadTicket, EstatusTicket, Comentario
from app.models.catalogos import SLAConfig

def es_horario_laboral(dt: datetime) -> bool:
    """Verifica si la fecha está dentro del horario laboral (08:00 - 18:00)."""
    hora = dt.time()
    return time(8, 0) <= hora <= time(18, 0) and dt.weekday() < 5 # Lunes a Viernes

def ajustar_a_horario_laboral(dt: datetime) -> datetime:
    """Ajusta una fecha al próximo horario laboral si está fuera de él."""
    if es_horario_laboral(dt):
        return dt
    
    # Si es fin de semana o fuera de horario, mover al siguiente día hábil a las 08:00
    if dt.weekday() >= 5 or dt.time() >= time(18, 0):
        # Mover al siguiente día
        dias_a_sumar = 1
        while (dt + timedelta(days=dias_a_sumar)).weekday() >= 5:
            dias_a_sumar += 1
        dt = (dt + timedelta(days=dias_a_sumar)).replace(hour=8, minute=0, second=0, microsecond=0)
    elif dt.time() < time(8, 0):
        dt = dt.replace(hour=8, minute=0, second=0, microsecond=0)
        
    return dt

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
    """Calcula la fecha de vencimiento basada en la prioridad y configuración de BD, respetando horario laboral."""
    horas_asignadas = 24
    
    if db:
        config = db.query(SLAConfig).filter(SLAConfig.prioridad == prioridad.value).first()
        if config:
            horas_asignadas = config.horas
        else:
            horas_sla = {
                PrioridadTicket.Critica: 2,
                PrioridadTicket.Alta: 8,
                PrioridadTicket.Media: 24,
                PrioridadTicket.Baja: 72
            }
            horas_asignadas = horas_sla.get(prioridad, 24)
    else:
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
        
    # Ajustar a horario laboral si es necesario
    base_date = ajustar_a_horario_laboral(base_date)
    
    return base_date + timedelta(hours=horas_asignadas)

def activar_sla_automaticamente(ticket, db: Session):
    """Activa el SLA automáticamente si ha pasado 1 hora sin respuesta y está en horario laboral."""
    ahora = datetime.utcnow()
    # Si no hay primera respuesta y han pasado más de 60 minutos
    if ticket.fecha_primera_respuesta is None and (ahora - ticket.fecha_creacion).total_seconds() > 3600:
        if es_horario_laboral(ahora):
            ticket.fecha_primera_respuesta = ahora
            ticket.fecha_vencimiento_sla = calcular_vencimiento_sla(ticket.prioridad, start_date=ahora, db=db)
            
            log = Comentario(
                ticket_id=ticket.id,
                autor_id=1, # Admin por defecto para mensajes automáticos
                texto="SISTEMA: No se recibió respuesta en 1 hora. Ticket activado automáticamente.",
            )
            db.add(log)
            db.commit()
            return True
    return False

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
