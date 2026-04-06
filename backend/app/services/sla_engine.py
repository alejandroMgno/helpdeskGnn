# backend/app/services/sla_engine.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.usuario import Usuario, StatusTecnico

def calcular_vencimiento_sla(prioridad: str) -> datetime:
    """Calcula la fecha de vencimiento basada en la prioridad."""
    horas_sla = {
        "Crítica": 2,
        "Alta": 8,
        "Media": 24,
        "Baja": 48
    }
    horas_asignadas = horas_sla.get(prioridad, 24)
    return datetime.utcnow() + timedelta(hours=horas_asignadas)

def asignar_tecnico_inteligente(db: Session, solicitante_id: int) -> int | None:
    """
    Intenta asignar al técnico base. Si está inactivo, ocupado, comiendo o de vacaciones, 
    busca al de respaldo. Si no hay ninguno, lo manda a la cola general (None).
    """
    solicitante = db.query(Usuario).filter(Usuario.id == solicitante_id).first()
    if not solicitante:
        return None

    # 1. Intentar con el Técnico Base
    if solicitante.tecnico_base_id:
        titular = db.query(Usuario).filter(Usuario.id == solicitante.tecnico_base_id).first()
        if titular and titular.status_tecnico == StatusTecnico.Activo:
            return titular.id

    # 2. Intentar con el Técnico de Respaldo
    if solicitante.tecnico_secundario_id:
        respaldo = db.query(Usuario).filter(Usuario.id == solicitante.tecnico_secundario_id).first()
        if respaldo and respaldo.status_tecnico == StatusTecnico.Activo:
            return respaldo.id

    # 3. Nadie disponible (se queda en la cola sin asignar para que un Admin lo tome)
    return None