from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.models.ticket import Ticket

def asignar_tecnico_inteligente(db: Session, ticket: Ticket):
    usuario = db.query(Usuario).filter(Usuario.id == ticket.usuario_id).first()
    
    # 1. Intentar con el técnico preferente del usuario
    tecnico = db.query(Usuario).filter(Usuario.id == usuario.tecnico_preferente_id).first()
    
    # 2. Si el técnico no está disponible o es prioridad Crítica/Alta, buscar respaldo
    if not tecnico or tecnico.status != "activo" or ticket.sla_prioridad in ["Critica", "Alta"]:
        # Buscar técnicos activos en la misma zona con menos carga
        backup = db.query(Usuario).filter(
            Usuario.rol == "tecnico",
            Usuario.status == "activo",
            Usuario.zona == usuario.zona
        ).first() # Aquí podrías agregar lógica de conteo de tickets para balancear
        
        if backup:
            tecnico = backup
            
    ticket.tecnico_id = tecnico.id if tecnico else None
    return ticket