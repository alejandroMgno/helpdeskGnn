# backend/app/api/routes/dashboard.py
from typing import Optional
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.api.dependencies import get_db, get_current_user
from app.models.usuario import Usuario, RolUsuario, StatusTecnico
from app.models.ticket import Ticket, EstatusTicket
from app.models.activo import Activo
from app.models.auditoria import RegistroAuditoria
from app.services.websocket_manager import manager
from app.services.maintenance_engine import cerrar_tickets_automaticos

router = APIRouter()

@router.websocket("/ws/{user_id}")
@router.websocket("/ws")
async def dashboard_websocket(websocket: WebSocket, user_id: Optional[int] = None):
    await manager.connect_global(websocket)
    if user_id:
        await manager.connect_user(websocket, user_id)
        # Notificar cambio en técnicos online
        await manager.broadcast_global({"type": "update_dashboard"})
    try:
        while True:
            # Mantenemos la conexión viva
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_global(websocket)
        if user_id:
            manager.disconnect_user(websocket, user_id)
            # Notificar salida del técnico
            await manager.broadcast_global({"type": "update_dashboard"})

from typing import Optional

@router.get("/stats")
def get_dashboard_stats(
    fecha_inicio: Optional[datetime] = None,
    fecha_fin: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Tarea de mantenimiento: Cerrar tickets de más de 24h resueltos
    cerrar_tickets_automaticos(db)

    ahora = datetime.utcnow()
    
    # 🔥 FIX: Convertir fechas offset-aware (del frontend) a naive (UTC) para evitar error de resta
    if fecha_inicio and fecha_inicio.tzinfo is not None:
        fecha_inicio = fecha_inicio.replace(tzinfo=None)
    if fecha_fin and fecha_fin.tzinfo is not None:
        fecha_fin = fecha_fin.replace(tzinfo=None)

    # Si no se pasan fechas, por defecto usamos los últimos 30 días para los totales
    if not fecha_inicio:
        fecha_inicio = ahora - timedelta(days=30)
    if not fecha_fin:
        fecha_fin = ahora

    # 1. KPIs Globales (Filtrados por fecha de creación donde aplique)
    query_tickets = db.query(Ticket).filter(Ticket.fecha_creacion >= fecha_inicio, Ticket.fecha_creacion <= fecha_fin)
    total_tickets = query_tickets.count()
    
    # SLA Críticos (Snapshot actual - No depende de la fecha seleccionada para ser útil)
    criticos_sla = db.query(Ticket).filter(
        Ticket.estatus != EstatusTicket.Cerrado,
        Ticket.fecha_vencimiento_sla != None,
        Ticket.fecha_vencimiento_sla <= ahora + timedelta(hours=2)
    ).count()

    # Valor de Activos (Suma total histórica - El usuario pidió general)
    valor_total_activos = db.query(func.sum(Activo.costo)).filter(Activo.is_deleted == 0).scalar() or 0

    # Técnicos Online (Basado en conexiones WS activas Y estatus disponible)
    ids_online = [int(uid) for uid in manager.user_connections.keys()]
    if ids_online:
        tecnicos_online = db.query(Usuario).filter(
            Usuario.id.in_(ids_online),
            Usuario.rol == RolUsuario.Tecnico,
            Usuario.is_active == True,
            Usuario.status_tecnico == StatusTecnico.Activo  # 🔥 Solo contar si está en 'Activo'
        ).count()
    else:
        tecnicos_online = 0
    
    total_tecnicos = db.query(Usuario).filter(
        Usuario.rol == RolUsuario.Tecnico,
        Usuario.is_active == True
    ).count()

    # 2. Tendencia (Adaptable al rango seleccionado)
    # Si el rango es <= 1 día, mostramos por hora
    diferencia = fecha_fin - fecha_inicio
    if diferencia.days < 1:
        tendencia_raw = db.query(
            func.strftime('%H:00', Ticket.fecha_creacion).label('etiqueta'),
            func.count(Ticket.id).label('total')
        ).filter(Ticket.fecha_creacion >= fecha_inicio, Ticket.fecha_creacion <= fecha_fin).group_by('etiqueta').all()
    else:
        tendencia_raw = db.query(
            func.date(Ticket.fecha_creacion).label('etiqueta'),
            func.count(Ticket.id).label('total')
        ).filter(Ticket.fecha_creacion >= fecha_inicio, Ticket.fecha_creacion <= fecha_fin).group_by('etiqueta').all()
    
    tendencia = [{"name": str(t.etiqueta), "tickets": t.total} for t in tendencia_raw]
    
    # 💡 Fallback: Si no hay datos, enviamos puntos en 0 para que la gráfica no se vea "rota"
    if not tendencia:
        tendencia = [
            {"name": fecha_inicio.strftime('%Y-%m-%d'), "tickets": 0},
            {"name": fecha_fin.strftime('%Y-%m-%d'), "tickets": 0}
        ]

    # 3. Distribución de Activos (General)
    distribucion_activos = db.query(
        Activo.tipo,
        func.sum(Activo.costo).label('valor'),
        func.count(Activo.id).label('cantidad')
    ).filter(Activo.is_deleted == 0).group_by(Activo.tipo).all()
    
    financiero = [{"categoria": str(d.tipo.value) if d.tipo else "Sin Categoría", "valor": d.valor, "cantidad": d.cantidad} for d in distribucion_activos]

    # 4. Actividad Reciente (Global - Obtener la actividad más reciente por cada usuario)
    subq = db.query(
        RegistroAuditoria.usuario_id,
        func.max(RegistroAuditoria.fecha).label('max_fecha')
    ).group_by(RegistroAuditoria.usuario_id).subquery()
    
    actividad_raw = db.query(RegistroAuditoria).join(
        subq, 
        (RegistroAuditoria.usuario_id == subq.c.usuario_id) & 
        (RegistroAuditoria.fecha == subq.c.max_fecha)
    ).order_by(desc(RegistroAuditoria.fecha)).limit(10).all()
    
    actividad = []
    for a in actividad_raw:
        user_obj = db.query(Usuario).filter(Usuario.id == a.usuario_id).first()
        actividad.append({
            "usuario": user_obj.nombre_completo if user_obj else "Sistema",
            "accion": a.accion,
            "tabla": a.tabla_afectada,
            "fecha": a.fecha.isoformat()
        })

    # ... [Resto del código] ...

    # 5. Tickets en Riesgo (Listado para reasignar - Snapshot actual)
    tickets_riesgo_raw = db.query(Ticket).filter(
        Ticket.estatus != EstatusTicket.Cerrado,
        Ticket.fecha_vencimiento_sla != None,
        Ticket.fecha_vencimiento_sla <= ahora + timedelta(hours=8)
    ).order_by(Ticket.fecha_vencimiento_sla).limit(5).all()
    
    tickets_riesgo = []
    for t in tickets_riesgo_raw:
        diff = t.fecha_vencimiento_sla - ahora
        vence_en = f"{diff.seconds // 3600}h { (diff.seconds // 60) % 60}m" if diff.total_seconds() > 0 else "VENCIDO"
        tickets_riesgo.append({
            "id": t.id,
            "titulo": t.titulo,
            "asignado": t.tecnico.nombre_completo if t.tecnico else "Sin Asignar",
            "estatusAsignado": t.tecnico.status_tecnico.value if t.tecnico else "N/A",
            "venceEn": vence_en,
            "color": "red" if diff.total_seconds() <= 0 else "orange"
        })

    # 6. Monitor de Agentes (Estado de Agenda - Snapshot actual)
    tecnicos_list_raw = db.query(Usuario).filter(Usuario.rol == RolUsuario.Tecnico, Usuario.is_active == True).all()
    tecnicos_list = []
    for tec in tecnicos_list_raw:
        carga = db.query(Ticket).filter(
            Ticket.tecnico_asignado_id == tec.id,
            Ticket.estatus != EstatusTicket.Cerrado
        ).count()
        
        # Calificación Promedio
        avg_rating = db.query(func.avg(Ticket.satisfaccion_estrellas)).filter(
            Ticket.tecnico_asignado_id == tec.id,
            Ticket.satisfaccion_estrellas != None
        ).scalar() or 5.0

        tecnicos_list.append({
            "id": tec.id,
            "nombre": tec.nombre_completo,
            "estatus": tec.status_tecnico.value,
            "carga": f"{carga} tickets",
            "sla": f"{round(avg_rating, 1)} ★",
            "color": "emerald" if tec.id in ids_online else "slate"
        })

    # 7. Mantenimientos (Salud de Activos - Snapshot actual)
    mantenimientos_raw = db.query(Activo).filter(
        Activo.is_deleted == 0,
        Activo.fecha_proximo_mantenimiento <= ahora + timedelta(days=7)
    ).limit(5).all()
    
    mantenimientos = []
    for m in mantenimientos_raw:
        atraso = (ahora - m.fecha_proximo_mantenimiento).days if m.fecha_proximo_mantenimiento else 0
        mantenimientos.append({
            "nombre": m.nombre,
            "atraso": max(0, atraso)
        })

    # 8. KPIs Personales / Usuario (En el periodo)
    mis_tickets_activos = db.query(Ticket).filter(
        Ticket.tecnico_asignado_id == current_user.id, 
        Ticket.estatus.in_([EstatusTicket.Abierto, EstatusTicket.En_Progreso, EstatusTicket.Resuelto]),
        Ticket.fecha_creacion >= fecha_inicio,
        Ticket.fecha_creacion <= fecha_fin
    ).count()
    
    mis_tickets_resueltos_periodo = db.query(Ticket).filter(
        Ticket.tecnico_asignado_id == current_user.id, 
        Ticket.estatus == EstatusTicket.Cerrado,
        Ticket.fecha_creacion >= fecha_inicio,
        Ticket.fecha_creacion <= fecha_fin
    ).count()

    # Calificación Promedio Personal (Histórica)
    mi_avg_rating = db.query(func.avg(Ticket.satisfaccion_estrellas)).filter(
        Ticket.tecnico_asignado_id == current_user.id,
        Ticket.satisfaccion_estrellas != None
    ).scalar() or 5.0

    # Mis Próximos Vencimientos (Técnico)
    mis_vencimientos_raw = db.query(Ticket).filter(
        Ticket.tecnico_asignado_id == current_user.id,
        Ticket.estatus.in_([EstatusTicket.Abierto, EstatusTicket.En_Progreso]),
        Ticket.fecha_vencimiento_sla != None
    ).order_by(Ticket.fecha_vencimiento_sla).limit(5).all()
    
    mis_vencimientos = []
    for t in mis_vencimientos_raw:
        diff = t.fecha_vencimiento_sla - ahora
        vence_en = f"{diff.seconds // 3600}h { (diff.seconds // 60) % 60}m" if diff.total_seconds() > 0 else "VENCIDO"
        mis_vencimientos.append({
            "id": t.id,
            "titulo": t.titulo,
            "venceEn": vence_en,
            "color": "red" if diff.total_seconds() <= 0 else "orange"
        })

    # Mis Solicitudes (Usuario)
    mis_solicitudes = db.query(Ticket).filter(
        Ticket.solicitante_id == current_user.id, 
        Ticket.estatus.in_([EstatusTicket.Abierto, EstatusTicket.En_Progreso, EstatusTicket.Resuelto])
    ).count()

    mis_equipos_raw = db.query(Activo).filter(
        Activo.usuario_id == current_user.id,
        Activo.is_deleted == 0
    ).all()
    
    mis_equipos_list = []
    for e in mis_equipos_raw:
        mis_equipos_list.append({
            "nombre": e.nombre,
            "serie": e.serie,
            "tipo": e.tipo.value if e.tipo else "General",
            "estatus": e.estatus.value if e.estatus else "Activo"
        })

    # Actividad Personal (Filtrada para Técnicos y Usuarios)
    mi_actividad_raw = db.query(RegistroAuditoria).filter(
        RegistroAuditoria.usuario_id == current_user.id
    ).order_by(desc(RegistroAuditoria.fecha)).limit(10).all()
    
    mi_actividad = []
    for a in mi_actividad_raw:
        mi_actividad.append({
            "usuario": current_user.nombre_completo,
            "accion": a.accion,
            "tabla": a.tabla_afectada,
            "fecha": a.fecha.isoformat()
        })

    # KPI de Tickets Totales (Admin vs Usuario)
    display_total_tickets = total_tickets
    if current_user.rol == RolUsuario.Usuario:
        display_total_tickets = db.query(Ticket).filter(Ticket.solicitante_id == current_user.id).count()

    stats = {
        "admin": {
            "ticketsTotales": display_total_tickets,
            "criticosSLA": criticos_sla, 
            "tecnicosOnline": tecnicos_online,
            "tecnicosTotal": total_tecnicos,
            "valorActivos": valor_total_activos,
            "tendencia": tendencia,
            "financiero": financiero,
            "actividad": actividad,
            "ticketsRiesgo": tickets_riesgo,
            "tecnicos": tecnicos_list,
            "mantenimientos": mantenimientos
        },
        "tecnico": {
            "activos": mis_tickets_activos,
            "resueltos": mis_tickets_resueltos_periodo,
            "csat": round(mi_avg_rating, 1),
            "ticketsRiesgo": mis_vencimientos,
            "actividad": mi_actividad,
            "tendencia": tendencia # Se mantiene tendencia general o se podría filtrar por el técnico
        },
        "usuario": {
            "solicitudes": mis_solicitudes,
            "equipos": len(mis_equipos_list), 
            "equiposList": mis_equipos_list,
            "csat": 5.0, # Placeholder o promedio de sus calificaciones dadas
            "actividad": mi_actividad
        }
    }
    
    return stats