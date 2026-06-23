# backend/app/api/routes/activos.py
import os
import shutil
import pandas as pd
import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user, get_current_active_user
from app.models.usuario import Usuario, RolUsuario
from app.models.activo import Activo, Mantenimiento, activo_licencia, TipoActivo, EstatusActivo
from app.models.licencia import Licencia
from app.models.catalogos import Marca, Proveedor
from dateutil.relativedelta import relativedelta
from datetime import datetime

# IMPORTANTE: Asegúrate de tener ActivoUpdate en tu archivo schemas/activo.py
from app.schemas.activo import ActivoCreate, ActivoResponse, ActivoUpdate, MantenimientoCreate, MantenimientoResponse, ActivoBaja
from app.services.email_service import notificar_activo_asignado, notificar_mantenimiento_realizado

router = APIRouter()

# Crear directorio para facturas si no existe
os.makedirs("uploads/facturas", exist_ok=True)

@router.get("/export/excel")
def exportar_activos_excel(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Exportar inventario en una sola hoja con ejemplos de valores válidos."""
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para exportar datos.")

    # 1. Obtener datos reales
    activos = db.query(Activo).filter(Activo.is_deleted == 0).all()
    
    data = []
    
    # --- FILA DE EJEMPLO (GUÍA) ---
    data.append({
        "Codigo": "EJEMPLO-001",
        "Nombre": "Nombre del Equipo",
        "Modelo": "Modelo del Equipo",
        "Marca": "Marca (Ej: Dell, HP, Apple)",
        "Tipo": f"VALORES: {[t.value for t in TipoActivo]}",
        "Estatus": f"VALORES: {[e.value for e in EstatusActivo]}",
        "Serie": "Número de Serie",
        "Usuario_Email": "correo@ejemplo.com",
        "Costo": 0.0,
        "Factura": "No. Factura",
        "Fecha_Compra": "AAAA-MM-DD",
        "RAM": "Ej: 16GB",
        "CPU": "Ej: Core i7",
        "Almacenamiento": "Ej: 512GB SSD",
        "IMEI": "Ej: 123456789 (Celulares)",
        "Chip": "Ej: Telcel (Celulares)",
        "Pulgadas": "Ej: 14",
        "Formato": "Ej: Laptop, Desktop",
        "Anios_Garantia": 1
    })

    # --- DATOS REALES ---
    for a in activos:
        data.append({
            "Codigo": a.codigo,
            "Nombre": a.nombre,
            "Modelo": a.modelo,
            "Marca": a.marca.nombre if a.marca else (a.marca_texto or "N/A"),
            "Tipo": a.tipo.value if a.tipo else "N/A",
            "Estatus": a.estatus.value if a.estatus else "N/A",
            "Serie": a.serie,
            "Usuario_Email": a.usuario.email if a.usuario else "N/A",
            "Costo": a.costo,
            "Factura": a.factura_numero,
            "Fecha_Compra": a.fecha_compra.strftime("%Y-%m-%d") if a.fecha_compra else "N/A",
            "RAM": a.ram,
            "CPU": a.cpu,
            "Almacenamiento": a.almacenamiento,
            "IMEI": a.imei,
            "Chip": a.chip,
            "Pulgadas": a.pulgadas,
            "Formato": a.formato,
            "Anios_Garantia": a.anios_garantia
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Inventario_GNN')
    
    output.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="inventario_gnn_{datetime.now().strftime("%Y%m%d")}.xlsx"'
    }
    return Response(content=output.getvalue(), headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.post("/import/excel")
async def importar_activos_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Importar activos masivamente ignorando la fila de ejemplo."""
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden importar datos.")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))
    
    required_cols = ["Codigo", "Nombre", "Tipo", "Estatus"]
    for col in required_cols:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Falta la columna requerida: {col}")

    marcas = {m.nombre.lower(): m.id for m in db.query(Marca).all()}
    usuarios = {u.email.lower(): u.id for u in db.query(Usuario).all()}
    tipos_validos = {t.value: t for t in TipoActivo}
    estatus_validos = {e.value: e for e in EstatusActivo}

    errores = []
    importados = 0

    for index, row in df.iterrows():
        try:
            codigo = str(row["Codigo"]).strip()
            # Omitir fila de ejemplo o vacía
            if not codigo or codigo == "nan" or "EJEMPLO" in codigo.upper(): continue
            
            if db.query(Activo).filter(Activo.codigo == codigo).first():
                errores.append(f"Fila {index+2}: El código '{codigo}' ya existe.")
                continue

            tipo_str = str(row["Tipo"]).strip()
            tipo_enum = tipos_validos.get(tipo_str, TipoActivo.Computo)
            estatus_str = str(row["Estatus"]).strip()
            estatus_enum = estatus_validos.get(estatus_str, EstatusActivo.Disponible)

            marca_nombre = str(row.get("Marca", "")).strip().lower()
            marca_id = marcas.get(marca_nombre)
            user_email = str(row.get("Usuario_Email", "")).strip().lower()
            usuario_id = usuarios.get(user_email)

            activo_data = {
                "codigo": codigo,
                "nombre": str(row["Nombre"]).strip(),
                "modelo": str(row.get("Modelo", "")).strip() if pd.notna(row.get("Modelo")) else None,
                "tipo": tipo_enum,
                "estatus": estatus_enum,
                "marca_id": marca_id,
                "usuario_id": usuario_id,
                "serie": str(row.get("Serie", "")).strip() if pd.notna(row.get("Serie")) else None,
                "costo": float(row.get("Costo", 0)) if pd.notna(row.get("Costo")) else 0,
                "factura_numero": str(row.get("Factura", "")).strip() if pd.notna(row.get("Factura")) else None,
                "ram": str(row.get("RAM", "")).strip() if pd.notna(row.get("RAM")) else None,
                "cpu": str(row.get("CPU", "")).strip() if pd.notna(row.get("CPU")) else None,
                "almacenamiento": str(row.get("Almacenamiento", "")).strip() if pd.notna(row.get("Almacenamiento")) else None,
                "imei": str(row.get("IMEI", "")).strip() if pd.notna(row.get("IMEI")) else None,
                "chip": str(row.get("Chip", "")).strip() if pd.notna(row.get("Chip")) else None,
                "pulgadas": str(row.get("Pulgadas", "")).strip() if pd.notna(row.get("Pulgadas")) else None,
                "formato": str(row.get("Formato", "")).strip() if pd.notna(row.get("Formato")) else None,
                "anios_garantia": int(row.get("Anios_Garantia", 1)) if pd.notna(row.get("Anios_Garantia")) else 1,
                "historial": [{"fecha": datetime.utcnow().isoformat(), "evento": "Importación Masiva", "notas": "Cargado vía Excel"}]
            }

            if pd.notna(row.get("Fecha_Compra")):
                try: activo_data["fecha_compra"] = pd.to_datetime(row["Fecha_Compra"])
                except: pass

            nuevo_activo = Activo(**activo_data)
            db.add(nuevo_activo)
            importados += 1
            
        except Exception as e:
            errores.append(f"Fila {index+2}: Error - {str(e)}")

    db.commit()
    return {"status": "completado", "importados": importados, "errores": errores}

@router.post("/", response_model=ActivoResponse)
def crear_activo(activo_in: ActivoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Verificación de rol más robusta usando el Enum
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para registrar activos.")
    
    data = activo_in.model_dump()
    # Calcular próximo mantenimiento si hay fecha de último
    if data.get("fecha_ultimo_mantenimiento") and data.get("meses_mantenimiento"):
        data["fecha_proximo_mantenimiento"] = data["fecha_ultimo_mantenimiento"] + relativedelta(months=data["meses_mantenimiento"])
        
    # Inicializar historial
    data["historial"] = [{
        "fecha": datetime.utcnow().isoformat(),
        "evento": "Alta de Activo",
        "notas": f"Activo registrado por {current_user.nombre_completo}"
    }]

    nuevo_activo = Activo(**data)
    db.add(nuevo_activo)
    db.commit()
    db.refresh(nuevo_activo)
    return nuevo_activo

@router.get("/", response_model=List[ActivoResponse])
def listar_activos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Si es un usuario normal, solo ve sus propios equipos
    query = db.query(Activo).filter(Activo.is_deleted == 0)
    if current_user.rol == RolUsuario.Usuario:
        activos = query.filter(Activo.usuario_id == current_user.id).all()
        # 🔥 SEGURIDAD: Limpiar costos para usuarios finales
        for a in activos:
            a.costo = 0.0
            a.factura_numero = "CONFIDENCIAL"
            for m in a.mantenimientos:
                m.costo = 0.0
        return activos
    # Si es Admin/Técnico, ve todo el inventario
    return query.all()

# ==========================================
# NUEVO: RUTA PARA EDITAR Y REASIGNAR (PUT)
# ==========================================
@router.put("/{activo_id}", response_model=ActivoResponse)
def actualizar_activo(activo_id: int, activo_in: ActivoUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    # Validamos permisos
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar activos.")
        
    # Buscamos el activo
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")

    # Actualizamos dinámicamente solo los campos enviados
    update_data = activo_in.model_dump(exclude_unset=True)
    notas_historial = update_data.pop("notas", None)
    
    # ✅ LÓGICA DE ESTATUS AUTOMÁTICO Y NOTIFICACIONES:
    # Si se asigna un usuario y no se especifica estatus, o es 'Disponible', cambiar a 'Asignado'
    cambio_asignacion = False
    usuario_anterior = activo.usuario
    if "usuario_id" in update_data:
        nuevo_usuario_id = update_data["usuario_id"]
        if nuevo_usuario_id != activo.usuario_id:
            cambio_asignacion = True
            if nuevo_usuario_id is not None:
                if "estatus" not in update_data or update_data["estatus"] == "Disponible":
                    update_data["estatus"] = "Asignado"
                
                # Notificar al nuevo usuario
                nuevo_user = db.query(Usuario).filter(Usuario.id == nuevo_usuario_id).first()
                if nuevo_user:
                    background_tasks.add_task(notificar_activo_asignado, nuevo_user.email, activo.nombre, activo.codigo, "Asignación de Activo (Alta)")
                
                # Si tenía un usuario anterior, avisarle de la desvinculación
                if usuario_anterior:
                    background_tasks.add_task(notificar_activo_asignado, usuario_anterior.email, activo.nombre, activo.codigo, "Retiro de Activo de su Inventario")
            else:
                if activo.estatus == "Asignado":
                    update_data["estatus"] = "Disponible"
                # 🚀 LIBERAR LICENCIAS AUTOMÁTICAMENTE AL VOLVER A STOCK
                activo.licencias = []
                
                # Avisar al usuario anterior de la liberación
                if usuario_anterior:
                    background_tasks.add_task(notificar_activo_asignado, usuario_anterior.email, activo.nombre, activo.codigo, "Retiro de Activo de su Inventario")

    # Si se cambia el último mantenimiento o los meses, recalculamos el próximo
    if "fecha_ultimo_mantenimiento" in update_data or "meses_mantenimiento" in update_data:
        fecha_u = update_data.get("fecha_ultimo_mantenimiento", activo.fecha_ultimo_mantenimiento)
        meses = update_data.get("meses_mantenimiento", activo.meses_mantenimiento)
        if fecha_u and meses:
            activo.fecha_proximo_mantenimiento = fecha_u + relativedelta(months=meses)

    # Registro en historial si hay cambios importantes
    historial_actual = list(activo.historial) if activo.historial else []
    
    if cambio_asignacion:
        nuevo_user_id = update_data.get("usuario_id")
        if nuevo_user_id:
            user = db.query(Usuario).filter(Usuario.id == nuevo_user_id).first()
            nombre_user = user.nombre_completo if user else "Desconocido"
            evento = "Reasignación de Activo"
            notas = f"Asignado a: {nombre_user}. " + (notas_historial or "")
        else:
            evento = "Liberación a Stock"
            notas = "Activo desvinculado del usuario. " + (notas_historial or "")
        
        historial_actual.append({
            "fecha": datetime.utcnow().isoformat(),
            "evento": evento,
            "notas": notas
        })
    elif notas_historial:
        historial_actual.append({
            "fecha": datetime.utcnow().isoformat(),
            "evento": "Actualización de Datos",
            "notas": notas_historial
        })

    # IMPORTANTE: Forzar el cambio en el historial para SQLAlchemy
    from sqlalchemy.orm.attributes import flag_modified
    activo.historial = historial_actual
    flag_modified(activo, "historial")

    for key, value in update_data.items():
        setattr(activo, key, value)

    db.commit()
    db.refresh(activo)

    # 🔥 SEGURIDAD: Limpiar costos si por alguna razón un usuario llama a esta ruta (aunque tenga 403 arriba)
    if current_user.rol == RolUsuario.Usuario:
        activo.costo = 0.0
        activo.factura_numero = "CONFIDENCIAL"
        for m in activo.mantenimientos:
            m.costo = 0.0

    return activo

# ==========================================
# NUEVO: BITÁCORA DE MANTENIMIENTO
# ==========================================
@router.post("/{activo_id}/mantenimientos", response_model=MantenimientoResponse)
def registrar_mantenimiento(
    activo_id: int, 
    mantenimiento_in: MantenimientoCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos.")

    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")

    # Crear el registro de bitácora
    nuevo_manto = Mantenimiento(
        **mantenimiento_in.model_dump(),
        activo_id=activo_id,
        tecnico_id=current_user.id
    )
    db.add(nuevo_manto)

    # Actualizar el activo: Salud y Fechas
    activo.fecha_ultimo_mantenimiento = mantenimiento_in.fecha
    if activo.meses_mantenimiento:
        activo.fecha_proximo_mantenimiento = mantenimiento_in.fecha + relativedelta(months=activo.meses_mantenimiento)
    
    # Si fue correctivo o preventivo, asegurar que el estatus sea Disponible tras el servicio
    activo.estatus = "Disponible"

    # Registrar en historial
    historial_actual = list(activo.historial) if activo.historial else []
    historial_actual.append({
        "fecha": datetime.utcnow().isoformat(),
        "evento": f"Mantenimiento {mantenimiento_in.tipo}",
        "notas": mantenimiento_in.descripcion
    })
    activo.historial = historial_actual
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(activo, "historial")

    db.commit()
    db.refresh(nuevo_manto)
    
    # Notificación de mantenimiento
    background_tasks.add_task(
        notificar_mantenimiento_realizado,
        current_user.email,
        activo.nombre,
        mantenimiento_in.tipo,
        mantenimiento_in.fecha.strftime("%d/%m/%Y"),
        activo.fecha_proximo_mantenimiento.strftime("%d/%m/%Y") if activo.fecha_proximo_mantenimiento else "N/A",
        mantenimiento_in.descripcion
    )
    
    return nuevo_manto

# ==========================================
# NUEVO: RUTA PARA SUBIR FACTURAS EN PDF
# ==========================================
@router.post("/{activo_id}/documentos")
def subir_documentos(
    activo_id: int, 
    files: List[UploadFile] = File(...), # <-- Ahora recibe una lista de archivos
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para adjuntar archivos.")

    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")

    # Asegurarnos de que existe la lista
    documentos_actuales = list(activo.documentos) if activo.documentos else []

    for file in files:
        if file.filename.endswith('.pdf'):
            file_path = f"uploads/facturas/activo_{activo_id}_{file.filename}"
            with open(file_path, "wb") as buffer:
                import shutil
                shutil.copyfileobj(file.file, buffer)
            documentos_actuales.append(file_path)

    # Reasignamos la lista actualizada al activo
    activo.documentos = documentos_actuales

    # Registrar en historial
    historial_actual = list(activo.historial) if activo.historial else []
    historial_actual.append({
        "fecha": datetime.utcnow().isoformat(),
        "evento": "Documentación Adjunta",
        "notas": f"Se subieron {len(files)} archivo(s) PDF."
    })
    activo.historial = historial_actual
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(activo, "historial")
    
    db.commit()
    db.refresh(activo)
    
    return {"status": "ok", "documentos": activo.documentos}

@router.post("/{activo_id}/baja")
async def dar_de_baja_especifica(
    activo_id: int,
    motivo: str = Form(...), # Robo, Venta, Obsolescencia
    notas: str = Form(None),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos.")

    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado.")

    # Validaciones de archivos obligatorios
    if motivo == "Robo" and (not files or len(files) == 0):
        raise HTTPException(status_code=400, detail="La denuncia por robo (PDF) es obligatoria.")
    if motivo == "Venta" and (not files or len(files) == 0):
        raise HTTPException(status_code=400, detail="La factura de venta (PDF) es obligatoria.")

    # Procesar archivos
    documentos_actuales = list(activo.documentos) if activo.documentos else []
    if files:
        for file in files:
            if file.filename.endswith('.pdf'):
                file_path = f"uploads/facturas/baja_{motivo.lower()}_{activo_id}_{file.filename}"
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                documentos_actuales.append(file_path)

    # Actualizar Activo
    activo.estatus = EstatusActivo.Baja if motivo != "Obsolescencia" else EstatusActivo.Obsoleto
    activo.motivo_baja = motivo
    activo.fecha_baja = datetime.utcnow()
    activo.documentos = documentos_actuales
    
    # Liberar usuario y licencias
    activo.usuario_id = None
    activo.licencias = []

    # Registrar en historial
    historial_actual = list(activo.historial) if activo.historial else []
    historial_actual.append({
        "fecha": datetime.utcnow().isoformat(),
        "evento": f"Baja por {motivo}",
        "notas": notas or f"Proceso de baja iniciado por {current_user.nombre_completo}"
    })
    activo.historial = historial_actual
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(activo, "historial")

    db.commit()
    db.refresh(activo)
    return activo

@router.post("/baja-definitiva-lote")
def baja_definitiva_lote(
    ids: List[int],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden aplicar bajas definitivas.")

    activos = db.query(Activo).filter(Activo.id.in_(ids)).all()
    
    for a in activos:
        if a.estatus != EstatusActivo.Obsoleto:
            continue
        
        a.estatus = EstatusActivo.BajaDefinitiva
        a.is_deleted = 1 # Mark as deleted for general listing
        
        historial_actual = list(a.historial) if a.historial else []
        historial_actual.append({
            "fecha": datetime.utcnow().isoformat(),
            "evento": "Baja Definitiva (Lote)",
            "notas": f"Baja definitiva aplicada por {current_user.nombre_completo}. Retirado permanentemente del inventario."
        })
        a.historial = historial_actual
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(a, "historial")

    db.commit()
    return {"status": "ok", "mensaje": f"Se aplicó baja definitiva a {len(activos)} activos."}

@router.delete("/{activo_id}")
def eliminar_activo(activo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar activos.")

    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="No encontrado")

    # Soft delete
    activo.is_deleted = 1
    activo.estatus = "Dado de Baja"
    # 🚀 LIBERAR LICENCIAS AUTOMÁTICAMENTE
    activo.licencias = []

    # Registrar en historial
    historial_actual = list(activo.historial) if activo.historial else []
    historial_actual.append({
        "fecha": datetime.utcnow().isoformat(),
        "evento": "Baja de Activo",
        "notas": "Activo marcado como eliminado y retirado de inventario."
    })
    activo.historial = historial_actual
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(activo, "historial")

    db.commit()
    return {"status": "ok", "mensaje": "Activo dado de baja y licencias liberadas"}
