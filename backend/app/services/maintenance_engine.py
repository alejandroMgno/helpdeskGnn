# backend/app/services/maintenance_engine.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.activo import Activo, EstatusActivo
from app.models.ticket import Ticket, EstatusTicket, Comentario
from app.services.websocket_manager import manager
from app.services.sla_engine import calcular_vencimiento_sla

def ejecutar_chequeo_mantenimiento(db: Session):
    """
    Checa activos que requieren mantenimiento pronto (15 días)
    y dispara notificaciones si es necesario.
    """
    ahora = datetime.utcnow()
    limite_alerta = ahora + timedelta(days=15)

    # Activos que vencen pronto y no están ya en mantenimiento o baja
    activos_vencidos = db.query(Activo).filter(
        Activo.is_deleted == False,
        Activo.estatus.in_([EstatusActivo.Asignado, EstatusActivo.Disponible]),
        Activo.fecha_proximo_mantenimiento <= limite_alerta
    ).all()

    alertas = []
    for activo in activos_vencidos:
        # Aquí podrías agregar lógica para no repetir la alerta diario
        alertas.append({
            "id": activo.id,
            "codigo": activo.codigo,
            "nombre": activo.nombre,
            "vence": activo.fecha_proximo_mantenimiento.strftime("%d/%m/%Y") if activo.fecha_proximo_mantenimiento else "Pendiente",
            "atraso": (ahora - activo.fecha_proximo_mantenimiento).days if activo.fecha_proximo_mantenimiento else 0
        })
    
    return alertas

def iniciar_sla_automatico(db: Session):
    """
    Inicia automáticamente el SLA de tickets abiertos sin respuesta tras 1 hora.
    """
    ahora = datetime.utcnow()
    hace_1h = ahora - timedelta(hours=1)

    tickets_sin_respuesta = db.query(Ticket).filter(
        Ticket.estatus == EstatusTicket.Abierto,
        Ticket.fecha_primera_respuesta == None,
        Ticket.fecha_creacion <= hace_1h
    ).all()
    
    for ticket in tickets_sin_respuesta:
        ticket.fecha_primera_respuesta = ahora
        ticket.fecha_vencimiento_sla = calcular_vencimiento_sla(ticket.prioridad, start_date=ahora, db=db)
        ticket.estatus = EstatusTicket.En_Progreso
        
        log = Comentario(
            ticket_id=ticket.id,
            autor_id=1, # Admin ID 1
            texto="SISTEMA: Ticket no atendido en 1 hora. Iniciando revisión y SLA automáticamente.",
        )
        db.add(log)
        
    if tickets_sin_respuesta:
        db.commit()
        return len(tickets_sin_respuesta)
    return 0

def cerrar_tickets_automaticos(db: Session):
    """
    Cierra tickets que llevan más de 24 horas resueltos sin cierre del usuario.
    Se califican alto con comentario automático.
    Y envía un correo recordatorio después de 12 horas resuelto si no se ha notificado.
    """
    ahora = datetime.utcnow()
    hace_12h = ahora - timedelta(hours=12)
    hace_24h = ahora - timedelta(hours=24)

    # 1. Enviar correo de recordatorio después de 12 horas de estar resuelto (y antes de las 24 horas para no duplicar si ya se va a cerrar)
    tickets_por_notificar = db.query(Ticket).filter(
        Ticket.estatus == EstatusTicket.Resuelto,
        Ticket.fecha_resolucion <= hace_12h,
        Ticket.fecha_resolucion > hace_24h,
        (Ticket.notificado_recordatorio_cierre == False) | (Ticket.notificado_recordatorio_cierre == None)
    ).all()

    if tickets_por_notificar:
        from app.services.email_service import notificar_recordatorio_cierre_ticket
        for ticket in tickets_por_notificar:
            if ticket.solicitante and ticket.solicitante.email:
                try:
                    notificar_recordatorio_cierre_ticket(ticket.solicitante.email, ticket.id, ticket.titulo)
                except Exception as e:
                    print(f"Error enviando correo de recordatorio de cierre para ticket #{ticket.id}: {str(e)}")
            ticket.notificado_recordatorio_cierre = True
        db.commit()

    # 2. Cerrar automáticamente tickets de más de 24 horas resueltos
    tickets_por_cerrar = db.query(Ticket).filter(
        Ticket.estatus == EstatusTicket.Resuelto,
        Ticket.fecha_resolucion <= hace_24h
    ).all()

    for ticket in tickets_por_cerrar:
        ticket.estatus = EstatusTicket.Cerrado
        if not ticket.satisfaccion_estrellas:
            ticket.satisfaccion_estrellas = 5
            ticket.satisfaccion_comentario = "Ticket cerrado automáticamente por falta de respuesta del usuario"
    
    if tickets_por_cerrar:
        db.commit()
        return len(tickets_por_cerrar)
    return 0

async def disparar_notificaciones_mantenimiento(db: Session, admin_ids: list[int]):
    """Envía alertas via WebSocket a los administradores."""
    alertas = ejecutar_chequeo_mantenimiento(db)
    if not alertas:
        return

    for admin_id in admin_ids:
        await manager.notify_user(admin_id, {
            "type": "notification",
            "title": "Mantenimiento Preventivo",
            "body": f"Tienes {len(alertas)} equipos que requieren mantenimiento pronto.",
            "category": "mantenimiento"
        })
