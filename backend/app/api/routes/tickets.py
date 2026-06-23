from fastapi import APIRouter, Depends, HTTPException, Body, WebSocket, WebSocketDisconnect, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import String
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from app.api.dependencies import get_db, get_current_active_user
from app.models.usuario import Usuario
from app.models.ticket import Ticket, EstatusTicket, Comentario, PrioridadTicket
from app.schemas.ticket import TicketCreate, TicketResponse, TicketUpdate
from app.models.usuario import RolUsuario
from app.services.sla_engine import calcular_vencimiento_sla, asignar_tecnico_inteligente, pausar_sla, reanudar_sla
from app.services.websocket_manager import manager
from app.services.email_service import notificar_ticket_nuevo, notificar_ticket_reasignado, notificar_ticket_cerrado

router = APIRouter()

def procesar_sla(ticket: Ticket, nuevo_estatus: EstatusTicket, db: Session, user: Usuario):
    """Maneja la lógica de primera respuesta, pausas y resolución de SLA."""
    ahora = datetime.utcnow()
    estatus_anterior = ticket.estatus

    # 1. Lógica de Primera Respuesta
    if ticket.fecha_primera_respuesta is None:
        if nuevo_estatus == EstatusTicket.En_Progreso or user.rol == RolUsuario.Tecnico:
            ticket.fecha_primera_respuesta = ahora
            ticket.fecha_vencimiento_sla = calcular_vencimiento_sla(ticket.prioridad, start_date=ahora)
            
            # Log de primera respuesta
            log = Comentario(
                ticket_id=ticket.id,
                autor_id=user.id,
                texto=f"SISTEMA: Primera respuesta registrada. SLA inicia ahora.",
            )
            db.add(log)

    # 2. Lógica de Pausa (Entrar en espera)
    estatus_espera = [
        EstatusTicket.En_Espera_Pieza,
        EstatusTicket.En_Espera_Reunion,
        EstatusTicket.Escalado_Desarrollo,
        EstatusTicket.Escalado_Infraestructura,
        EstatusTicket.Escalado_Redes
    ]
    if nuevo_estatus in estatus_espera and estatus_anterior not in estatus_espera:
        ticket.ultima_fecha_pausa = ahora
        log = Comentario(
            ticket_id=ticket.id,
            autor_id=user.id,
            texto=f"SISTEMA: Ticket pausado ({nuevo_estatus.value}). El tiempo de SLA se detiene.",
        )
        db.add(log)

    # 3. Lógica de Reanudación (Salir de espera)
    if estatus_anterior in estatus_espera and nuevo_estatus not in estatus_espera:
        if ticket.ultima_fecha_pausa:
            segundos_pausa = int((ahora - ticket.ultima_fecha_pausa).total_seconds())
            ticket.tiempo_pausado_acumulado += segundos_pausa
            
            # Ajustar fecha de vencimiento SLA si existe
            if ticket.fecha_vencimiento_sla:
                ticket.fecha_vencimiento_sla += timedelta(seconds=segundos_pausa)
            
            ticket.ultima_fecha_pausa = None
            log = Comentario(
                ticket_id=ticket.id,
                autor_id=user.id,
                texto=f"SISTEMA: Ticket reanudado. Se añadieron {segundos_pausa // 60} minutos al SLA.",
            )
            db.add(log)

    # 4. Lógica de Resolución (Finalizar SLA)
    estatus_finales = [EstatusTicket.Resuelto, EstatusTicket.Cerrado, EstatusTicket.Cancelado]
    if nuevo_estatus in estatus_finales and estatus_anterior not in estatus_finales:
        ticket.fecha_resolucion = ahora
        log = Comentario(
            ticket_id=ticket.id,
            autor_id=user.id,
            texto=f"SISTEMA: SLA finalizado. Ticket {nuevo_estatus.value}.",
        )
        db.add(log)

async def procesar_escalacion(ticket: Ticket, estatus_anterior: EstatusTicket, nuevo_estatus: EstatusTicket, db: Session, current_user: Usuario):
    """Maneja la lógica de escalación: creación de ticket hijo y reanudación del padre al resolver el hijo."""
    ahora = datetime.utcnow()
    
    # 1. Detectar si se está escalando a una especialidad
    escalados = [EstatusTicket.Escalado_Desarrollo, EstatusTicket.Escalado_Infraestructura, EstatusTicket.Escalado_Redes]
    if nuevo_estatus in escalados and estatus_anterior not in escalados:
        specialty = None
        if nuevo_estatus == EstatusTicket.Escalado_Desarrollo:
            specialty = "Desarrollo"
        elif nuevo_estatus == EstatusTicket.Escalado_Infraestructura:
            specialty = "Infraestructura"
        elif nuevo_estatus == EstatusTicket.Escalado_Redes:
            specialty = "Redes"
            
        if specialty:
            # Buscar un técnico especialista
            from app.models.usuario import Usuario as ModelUsuario, RolUsuario
            specialist = db.query(ModelUsuario).filter(
                ModelUsuario.rol == RolUsuario.Tecnico,
                ModelUsuario.especialidad == specialty,
                ModelUsuario.is_active == True
            ).first()
            
            # Crear ticket hijo
            escalation_ticket = Ticket(
                titulo=f"[ESCALADO - {specialty}] {ticket.titulo}",
                descripcion=f"Ticket escalado desde el Ticket padre #{ticket.id}.\n\nDescripción original:\n{ticket.descripcion}",
                prioridad=ticket.prioridad,
                estatus=EstatusTicket.Abierto,
                departamento=specialty,
                solicitante_id=ticket.tecnico_asignado_id if ticket.tecnico_asignado_id else current_user.id,
                tecnico_asignado_id=specialist.id if specialist else None,
                parent_ticket_id=ticket.id,
                is_escalation=True
            )
            db.add(escalation_ticket)
            db.flush() # Obtener ID del ticket hijo
            
            # Comentario en el original (padre)
            log_parent = Comentario(
                ticket_id=ticket.id,
                autor_id=current_user.id,
                texto=f"SISTEMA: Ticket escalado a {specialty}. Se ha generado el ticket de escalación #{escalation_ticket.id}. El SLA se ha pausado."
            )
            db.add(log_parent)
            
            # Comentario en el nuevo (hijo)
            log_child = Comentario(
                ticket_id=escalation_ticket.id,
                autor_id=current_user.id,
                texto=f"SISTEMA: Ticket de escalación creado automáticamente a partir del Ticket padre #{ticket.id}."
            )
            db.add(log_child)
            
    # 2. Detectar si el ticket actual es un ticket hijo escalado y se está resolviendo/cerrando
    estatus_finales = [EstatusTicket.Resuelto, EstatusTicket.Cerrado, EstatusTicket.Cancelado]
    if ticket.is_escalation and nuevo_estatus in estatus_finales and estatus_anterior not in estatus_finales:
        if ticket.parent_ticket_id:
            parent = db.query(Ticket).filter(Ticket.id == ticket.parent_ticket_id).first()
            if parent and parent.estatus in escalados:
                # Reanudar el SLA del padre usando la lógica de procesar_sla (llamando antes de cambiar el estatus del padre)
                procesar_sla(parent, EstatusTicket.En_Progreso, db, current_user)
                parent.estatus = EstatusTicket.En_Progreso
                
                # Comentario en el original (padre)
                log_parent_resume = Comentario(
                    ticket_id=parent.id,
                    autor_id=current_user.id,
                    texto=f"SISTEMA: El ticket de escalación #{ticket.id} ha sido resuelto/cerrado. El SLA del ticket original se ha reanudado y el estatus vuelve a En Progreso."
                )
                db.add(log_parent_resume)
                
                # Broadcast parent ticket update
                try:
                    await manager.broadcast_to_ticket(parent.id, {
                        "type": "ticket_actualizado",
                        "data": {
                            "id": parent.id,
                            "estatus": parent.estatus.value,
                            "tecnico_asignado_id": parent.tecnico_asignado_id
                        }
                    })
                    await manager.broadcast_global({
                        "type": "update_dashboard",
                        "message": f"Ticket #{parent.id} reanudado a {parent.estatus.value}"
                    })
                except Exception as e:
                    print(f"Error broadcasting parent updates: {str(e)}")

@router.websocket("/ws/notifications/{user_id}")
async def notifications_websocket(websocket: WebSocket, user_id: int):
    await manager.connect_user(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_user(websocket, user_id)

@router.websocket("/ws/{ticket_id}")
async def ticket_websocket(websocket: WebSocket, ticket_id: int):
    await manager.connect(websocket, ticket_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, ticket_id)

# --- NUEVO ESQUEMA PARA VALIDAR ENTRADA ---
class ComentarioCreate(BaseModel):
    texto: str
    adjunto_url: Optional[str] = None
    adjunto_nombre: Optional[str] = None

@router.get("/{ticket_id}/comentarios")
def obtener_comentarios(ticket_id: int, db: Session = Depends(get_db)):
    coms = db.query(Comentario).filter(Comentario.ticket_id == ticket_id).all()
    return [{
        "id": c.id,
        "autor": c.autor.nombre_completo,
        "rol": c.autor.rol,
        "texto": c.texto,
        "fecha": c.fecha.strftime("%d %b, %I:%M %p"),
        "avatar": f"https://ui-avatars.com/api/?name={c.autor.nombre_completo.replace(' ', '+')}", # Fix espacios
        "adjunto_url": getattr(c, 'adjunto_url', None),  # Usamos getattr por si la columna aún no está en BD
        "adjunto_nombre": getattr(c, 'adjunto_nombre', None)
    } for c in coms]

@router.put("/{ticket_id}", response_model=TicketResponse)
async def actualizar_ticket(
    ticket_id: int,
    ticket_data: TicketUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Restricción: No se puede reasignar si el ticket ya está finalizado
    estatus_finales = [EstatusTicket.Resuelto, EstatusTicket.Cerrado, EstatusTicket.Cancelado]
    if ticket.estatus in estatus_finales and "tecnico_asignado_id" in ticket_data.dict(exclude_unset=True):
         raise HTTPException(status_code=400, detail="No se puede reasignar un ticket finalizado")

    # Solo administradores o técnicos pueden reasignar o cambiar prioridad/depto
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
         raise HTTPException(status_code=403, detail="No tienes permisos para actualizar este ticket")

    update_data = ticket_data.dict(exclude_unset=True)
    
    # Si cambia prioridad y el SLA ya inició, recalcular
    if "prioridad" in update_data and ticket.fecha_primera_respuesta:
        nueva_prioridad = update_data["prioridad"]
        if nueva_prioridad != ticket.prioridad:
            ticket.fecha_vencimiento_sla = calcular_vencimiento_sla(nueva_prioridad, start_date=ticket.fecha_primera_respuesta, db=db)
            # Si hay tiempo pausado acumulado, re-aplicarlo
            if ticket.tiempo_pausado_acumulado > 0:
                ticket.fecha_vencimiento_sla += timedelta(seconds=ticket.tiempo_pausado_acumulado)

    # Procesar SLA si cambia el estatus
    if "estatus" in update_data:
        nuevo_est = update_data["estatus"]
        
        # RESTRICT: No volver a 'Abierto' si ya se inició el SLA (primera respuesta)
        if ticket.fecha_primera_respuesta is not None and nuevo_est == EstatusTicket.Abierto:
            raise HTTPException(status_code=400, detail="No se puede regresar a estatus 'Abierto' después de la primera respuesta.")
            
        estatus_anterior = ticket.estatus
        procesar_sla(ticket, nuevo_est, db, current_user)
        await procesar_escalacion(ticket, estatus_anterior, nuevo_est, db, current_user)
        # Notificar cierre si aplica
        if nuevo_est in [EstatusTicket.Resuelto, EstatusTicket.Cerrado]:
            background_tasks.add_task(notificar_ticket_cerrado, ticket.solicitante.email, ticket.id, ticket.titulo)
            if ticket.tecnico:
                background_tasks.add_task(notificar_ticket_cerrado, ticket.tecnico.email, ticket.id, ticket.titulo)

    for key, value in update_data.items():
        setattr(ticket, key, value)
    
    # Si se cambia el técnico, registrarlo en el chat y notificar
    if "tecnico_asignado_id" in update_data:
        tec_id = update_data["tecnico_asignado_id"]
        if tec_id:
            tec = db.query(Usuario).filter(Usuario.id == tec_id).first()
            nombre_tec = tec.nombre_completo if tec else "Desconocido"
            # Notificar reasignación
            background_tasks.add_task(notificar_ticket_reasignado, ticket.solicitante.email, ticket.id, ticket.titulo, nombre_tec)
            if tec:
                background_tasks.add_task(notificar_ticket_reasignado, tec.email, ticket.id, ticket.titulo, nombre_tec)
        else:
            nombre_tec = "Sin asignar"
            
        log = Comentario(
            ticket_id=ticket_id,
            autor_id=current_user.id,
            texto=f"SISTEMA: Técnico asignado a {nombre_tec}",
        )
        db.add(log)

    db.commit()
    db.refresh(ticket)
    
    # NOTIFICACIÓN REAL-TIME
    await manager.broadcast_to_ticket(ticket_id, {
        "type": "ticket_actualizado",
        "data": {
            "id": ticket.id,
            "estatus": ticket.estatus.value,
            "tecnico_asignado_id": ticket.tecnico_asignado_id
        }
    })
    
    return ticket

@router.put("/{ticket_id}/estatus")
async def actualizar_estatus(
    ticket_id: int, 
    background_tasks: BackgroundTasks,
    nuevo_estatus: EstatusTicket = Body(..., embed=True), # Validamos contra el Enum
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket: 
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Restricción: No se puede cambiar el estatus si ya está Cerrado o Cancelado
    if ticket.estatus in [EstatusTicket.Cerrado, EstatusTicket.Cancelado]:
        raise HTTPException(status_code=400, detail="No se puede modificar un ticket ya cerrado o cancelado")

    # RESTRICT: No volver a 'Abierto' si ya se inició el SLA (primera respuesta)
    if ticket.fecha_primera_respuesta is not None and nuevo_estatus == EstatusTicket.Abierto:
        raise HTTPException(status_code=400, detail="No se puede regresar a estatus 'Abierto' después de la primera respuesta.")
        
    estatus_anterior = ticket.estatus
    procesar_sla(ticket, nuevo_estatus, db, current_user)
    await procesar_escalacion(ticket, estatus_anterior, nuevo_estatus, db, current_user)
    ticket.estatus = nuevo_estatus
    
    # Notificar cierre si aplica
    if nuevo_estatus in [EstatusTicket.Resuelto, EstatusTicket.Cerrado]:
        background_tasks.add_task(notificar_ticket_cerrado, ticket.solicitante.email, ticket.id, ticket.titulo)
        if ticket.tecnico:
            background_tasks.add_task(notificar_ticket_cerrado, ticket.tecnico.email, ticket.id, ticket.titulo)

    # Registro automático en el chat
    log = Comentario(
        ticket_id=ticket_id,
        autor_id=current_user.id,
        texto=f"SISTEMA: Estatus cambiado a {nuevo_estatus.value}",
    )
    db.add(log)
    db.commit()
    db.refresh(ticket)
    
    # NOTIFICACIÓN REAL-TIME
    await manager.broadcast_to_ticket(ticket_id, {
        "type": "ticket_actualizado",
        "data": {
            "id": ticket.id,
            "estatus": ticket.estatus.value,
            "tecnico_asignado_id": ticket.tecnico_asignado_id
        }
    })
    
    await manager.broadcast_global({
        "type": "update_dashboard",
        "message": f"Ticket #{ticket_id} actualizado a {nuevo_estatus.value}"
    })
    
    return {"status": "updated"}

@router.post("/{ticket_id}/comentarios")
async def agregar_comentario(
    ticket_id: int, 
    data: ComentarioCreate, # Usamos el esquema de Pydantic
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    # Verificamos que no sea vacío o solo espacios
    if not data.texto or not data.texto.strip():
        raise HTTPException(status_code=400, detail="El comentario no puede estar vacío")

    # Verificamos que el ticket exista primero
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")

    # Si el comentario es de un técnico, podría ser la primera respuesta
    procesar_sla(ticket, ticket.estatus, db, current_user)

    nuevo = Comentario(
        ticket_id=ticket_id, 
        autor_id=current_user.id, 
        texto=data.texto,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    
    # NOTIFICACIÓN REAL-TIME
    await manager.broadcast_to_ticket(ticket_id, {
        "type": "comentario_nuevo",
        "data": {
            "id": nuevo.id,
            "autor": current_user.nombre_completo,
            "rol": current_user.rol.value,
            "texto": nuevo.texto,
            "fecha": nuevo.fecha.strftime("%d %b, %I:%M %p")
        }
    })
    
    return {"status": "ok"}

@router.get("/{ticket_id}", response_model=TicketResponse)
def obtener_ticket(ticket_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    # Inyectar indicadores de SLA
    inyectar_indicadores_sla(ticket, db)
    return ticket

@router.get("/stats/counts")
def obtener_conteos(
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user),
    tecnico_id: Optional[int] = None,
    q: Optional[str] = None
):
    """Obtiene el conteo de tickets por estatus según el rol del usuario y filtros"""
    query = db.query(Ticket)
    
    # 1. Filtro base por Rol
    if current_user.rol == RolUsuario.Usuario:
        # El usuario normal SOLO ve sus propios tickets
        query = query.filter(Ticket.solicitante_id == current_user.id)
    elif current_user.rol == RolUsuario.Tecnico:
        # El técnico ve los que tiene asignados O aquellos donde es el titular/secundario del solicitante
        from app.models.usuario import Usuario as UserAlias
        query = query.join(UserAlias, Ticket.solicitante_id == UserAlias.id).filter(
            (Ticket.tecnico_asignado_id == current_user.id) |
            (UserAlias.tecnico_principal_id == current_user.id) |
            (UserAlias.tecnico_secundario_id == current_user.id)
        )
    
    # 2. Filtros de Administrador
    if current_user.rol == RolUsuario.Admin:
        if tecnico_id:
            query = query.filter(Ticket.tecnico_asignado_id == tecnico_id)
            
    # 3. Búsqueda Global
    if q:
        search = f"%{q}%"
        query = query.filter(
            (Ticket.titulo.ilike(search)) | 
            (Ticket.descripcion.ilike(search))
        )
    
    # IMPORTANTE: Re-usamos la query base ya filtrada para contar cada estatus
    # Hacemos una lista de los conteos para evitar ejecutar N queries si es posible, 
    # pero para SQLite/SQLAlchemy simple esta forma es clara:
    res = {}
    for est in EstatusTicket:
        res[est.value] = query.filter(Ticket.estatus == est).count()
    return res

@router.get("/stats/history")
def obtener_stats_historial(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtiene indicadores para el historial de tickets cerrados."""
    query_cerrados = db.query(Ticket).filter(Ticket.estatus == EstatusTicket.Cerrado)
    
    # 1. Total Cerrados
    total_cerrados = query_cerrados.count()
    
    # 2. Tiempo promedio de resolución (en horas)
    from sqlalchemy import func
    avg_res_seconds = db.query(func.avg(
        func.julianday(Ticket.fecha_resolucion) - func.julianday(Ticket.fecha_creacion)
    )).filter(Ticket.estatus == EstatusTicket.Cerrado, Ticket.fecha_resolucion != None).scalar()
    
    avg_res_hours = round(avg_res_seconds * 24, 1) if avg_res_seconds else 0
    
    # 3. Tickets Reabiertos
    total_reabiertos = db.query(Ticket).filter(Ticket.reabierto == True).count()
    
    # 4. Nivel de Satisfacción (Promedio estrellas)
    avg_satisfaccion = db.query(func.avg(Ticket.satisfaccion_estrellas)).filter(
        Ticket.estatus == EstatusTicket.Cerrado, 
        Ticket.satisfaccion_estrellas != None
    ).scalar() or 5.0

    return {
        "total_cerrados": total_cerrados,
        "avg_resolucion_horas": avg_res_hours,
        "total_reabiertos": total_reabiertos,
        "satisfaccion_promedio": round(avg_satisfaccion, 1)
    }

@router.post("/{ticket_id}/reabrir")
async def reabrir_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico] and ticket.solicitante_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para reabrir este ticket")

    ticket.estatus = EstatusTicket.Abierto
    ticket.reabierto = True
    
    log = Comentario(
        ticket_id=ticket.id,
        autor_id=current_user.id,
        texto=f"SISTEMA: Ticket reabierto por {current_user.nombre_completo}.",
    )
    db.add(log)
    db.commit()

    await manager.broadcast_global({
        "type": "update_dashboard",
        "message": f"Ticket #{ticket_id} ha sido reabierto"
    })

    return {"status": "ok"}

@router.get("/", response_model=List[TicketResponse])
def listar_tickets(
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user),
    limit: int = 100,
    skip: int = 0,
    estatus: Optional[str] = None,
    tecnico_id: Optional[int] = None,
    solicitante_id: Optional[int] = None,
    prioridad: Optional[str] = None,
    departamento: Optional[str] = None,
    fecha_desde: Optional[datetime] = None,
    fecha_hasta: Optional[datetime] = None,
    q: Optional[str] = None
):
    """Obtiene los tickets dependiendo del rol y filtros aplicados"""
    query = db.query(Ticket)
    
    # 1. Filtro base por Rol
    if current_user.rol == RolUsuario.Usuario:
        query = query.filter(Ticket.solicitante_id == current_user.id)
    elif current_user.rol == RolUsuario.Tecnico:
        from app.models.usuario import Usuario as UserAlias
        query = query.join(UserAlias, Ticket.solicitante_id == UserAlias.id).filter(
            (Ticket.tecnico_asignado_id == current_user.id) |
            (UserAlias.tecnico_principal_id == current_user.id) |
            (UserAlias.tecnico_secundario_id == current_user.id)
        )
    
    # 2. Filtros específicos
    if estatus:
        query = query.filter(Ticket.estatus == estatus)
    if tecnico_id:
        query = query.filter(Ticket.tecnico_asignado_id == tecnico_id)
    if solicitante_id:
        query = query.filter(Ticket.solicitante_id == solicitante_id)
    if prioridad:
        query = query.filter(Ticket.prioridad == prioridad)
    if departamento:
        query = query.filter(Ticket.departamento == departamento)
    
    # Filtros de Fecha
    if fecha_desde:
        query = query.filter(Ticket.fecha_creacion >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Ticket.fecha_creacion <= fecha_hasta)
        
    # 4. Búsqueda Global (Título, Descripción, ID, Usuario Email/Nombre)
    if q:
        from app.models.usuario import Usuario as UserAlias
        search = f"%{q}%"
        # Necesitamos un join con el solicitante si no se ha hecho
        if current_user.rol != RolUsuario.Tecnico:
            query = query.join(UserAlias, Ticket.solicitante_id == UserAlias.id)
            
        query = query.filter(
            (Ticket.titulo.ilike(search)) | 
            (Ticket.descripcion.ilike(search)) |
            (Ticket.id.cast(String).ilike(search)) |
            (UserAlias.nombre_completo.ilike(search)) |
            (UserAlias.email.ilike(search))
        )
    
    # Ordenamiento por fecha de actualización o cierre si es historial
    if estatus == EstatusTicket.Cerrado:
        tickets = query.order_by(Ticket.fecha_resolucion.desc()).offset(skip).limit(limit).all()
    else:
        tickets = query.order_by(Ticket.fecha_creacion.desc()).offset(skip).limit(limit).all()
    
    # Inyectar indicadores de SLA
    for t in tickets:
        inyectar_indicadores_sla(t, db)
        
    return tickets

def inyectar_indicadores_sla(ticket: Ticket, db: Session):
    """Calcula el porcentaje de cumplimiento y el color visual del SLA."""
    from app.models.catalogos import SLAConfig
    
    if not ticket.fecha_primera_respuesta or not ticket.fecha_vencimiento_sla:
        ticket.sla_cumplimiento_porcentaje = 0
        ticket.sla_estado_visual = None
        return

    # Tiempo total asignado (en segundos) desde la BD
    config = db.query(SLAConfig).filter(SLAConfig.prioridad == ticket.prioridad.value).first()
    horas_base = config.horas if config else 24
    total_asignado_segundos = horas_base * 3600
    
    # Tiempo transcurrido
    final_time = ticket.fecha_resolucion if ticket.fecha_resolucion else datetime.utcnow()
    
    # Tiempo consumido real
    consumido_segundos = (final_time - ticket.fecha_primera_respuesta).total_seconds() - ticket.tiempo_pausado_acumulado
    
    # Porcentaje
    porcentaje = (consumido_segundos / total_asignado_segundos) * 100
    ticket.sla_cumplimiento_porcentaje = round(porcentaje, 2)
    
    # Lógica de colores (Semáforo)
    if porcentaje > 100:
        ticket.sla_estado_visual = "vencido"
    elif porcentaje >= 66.6:
        ticket.sla_estado_visual = "rojo"
    elif porcentaje >= 33.3:
        ticket.sla_estado_visual = "amarillo"
    else:
        ticket.sla_estado_visual = "verde"

@router.post("/", response_model=TicketResponse)
def crear_ticket(ticket: TicketCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    
    tecnico_asignado_id = None
    
    # 🧠 LÓGICA DE ENRUTAMIENTO AUTOMÁTICO
    if current_user.tecnico_principal_id:
        # 1. Buscamos al técnico principal
        tec_principal = db.query(Usuario).filter(Usuario.id == current_user.tecnico_principal_id).first()
        
        if tec_principal and not tec_principal.ausente:
            # Si existe y NO está de vacaciones, se lo asignamos
            tecnico_asignado_id = tec_principal.id
        elif current_user.tecnico_secundario_id:
            # 2. Si el principal está ausente, buscamos al secundario
            tec_secundario = db.query(Usuario).filter(Usuario.id == current_user.tecnico_secundario_id).first()
            
            if tec_secundario and not tec_secundario.ausente:
                tecnico_asignado_id = tec_secundario.id

    # Creamos el ticket con el técnico que ganó la validación (o None si ambos están ausentes)
    nuevo_ticket = Ticket(
        titulo=ticket.titulo,
        descripcion=ticket.descripcion,
        prioridad=PrioridadTicket.Media,
        departamento=ticket.departamento,
        solicitante_id=current_user.id,
        tecnico_asignado_id=tecnico_asignado_id, # Asignación automática
        activo_id=str(ticket.activo_id) if ticket.activo_id else None,
        fecha_vencimiento_sla=None # Se calculará en la primera respuesta
    )
    
    db.add(nuevo_ticket)
    db.commit()
    db.refresh(nuevo_ticket)

    # Notificar por email
    background_tasks.add_task(notificar_ticket_nuevo, current_user.email, nuevo_ticket.id, nuevo_ticket.titulo, current_user.nombre_completo)
    if tecnico_asignado_id:
        tec = db.query(Usuario).filter(Usuario.id == tecnico_asignado_id).first()
        if tec:
            background_tasks.add_task(notificar_ticket_nuevo, tec.email, nuevo_ticket.id, nuevo_ticket.titulo, current_user.nombre_completo, tec.nombre_completo)
    
    # NOTIFICACIÓN REAL-TIME (Vía Background Task para evitar bloquear el loop)
    background_tasks.add_task(manager.broadcast_global, {
        "type": "update_dashboard",
        "message": f"Nuevo ticket creado: {nuevo_ticket.titulo}"
    })
    
    return nuevo_ticket

@router.post("/{ticket_id}/calificar")
async def calificar_ticket(
    ticket_id: int,
    estrellas: int,
    comentario: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    if ticket.solicitante_id != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el solicitante puede calificar el ticket")
    
    ticket.satisfaccion_estrellas = estrellas
    ticket.satisfaccion_comentario = comentario
    # NO lo cerramos aquí, el usuario debe dar click al botón de Cerrar o esperar 24h
    # ticket.estatus = EstatusTicket.Cerrado 
    
    db.commit()
    
    await manager.broadcast_global({
        "type": "update_dashboard",
        "message": f"Ticket #{ticket_id} calificado con {estrellas} estrellas"
    })
    
    return {"status": "ok"}

@router.post("/{ticket_id}/cerrar")
async def cerrar_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
    
    if ticket.solicitante_id != current_user.id and current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo el solicitante puede cerrar el ticket")
    
    if ticket.estatus != EstatusTicket.Resuelto:
        raise HTTPException(status_code=400, detail="El ticket debe estar Resuelto para poder cerrarse")

    ticket.estatus = EstatusTicket.Cerrado
    db.commit()

    await manager.broadcast_global({
        "type": "update_dashboard",
        "message": f"Ticket #{ticket_id} cerrado formalmente"
    })

    return {"status": "ok"}