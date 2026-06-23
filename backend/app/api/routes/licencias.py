import pandas as pd
import io
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user
from app.models.usuario import Usuario, RolUsuario
from app.models.licencia import Licencia
from app.models.activo import Activo
from app.models.catalogos import Proveedor
from app.schemas.licencia import LicenciaCreate, LicenciaResponse, LicenciaUpdate
from datetime import date, datetime
import os
import shutil

router = APIRouter()

@router.get("/export/excel")
def exportar_licencias_excel(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Exportar todas las licencias a Excel con fila de ejemplo."""
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para exportar licencias.")

    licencias = db.query(Licencia).all()
    
    data = []
    
    # --- FILA DE EJEMPLO (GUÍA) ---
    data.append({
        "ID": "EJEMPLO",
        "Nombre": "Nombre de la Licencia",
        "Categoría": "Ej: Software, Dominio, SSL",
        "Llave / Key": "Clave de activación",
        "Proveedor": "Nombre del Proveedor",
        "Asientos Totales": 1,
        "Asientos Usados": 0,
        "Fecha Vencimiento": "AAAA-MM-DD",
        "Estatus": "VALORES: Vigente, Por Vencer, Expirada, Baja",
        "Costo Anual": 0.0
    })

    for l in licencias:
        data.append({
            "ID": l.id,
            "Nombre": l.nombre,
            "Categoría": l.categoria,
            "Llave / Key": l.llave,
            "Proveedor": l.proveedor.nombre if l.proveedor else (l.proveedor_texto or "N/A"),
            "Asientos Totales": l.asientos_totales,
            "Asientos Usados": l.asientos_usados,
            "Fecha Vencimiento": l.fecha_vencimiento.strftime("%Y-%m-%d") if l.fecha_vencimiento else "N/A",
            "Estatus": l.estatus,
            "Costo Anual": l.costo_anual
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Licencias')
    
    output.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="licencias_gnn_{datetime.now().strftime("%Y%m%d")}.xlsx"'
    }
    return Response(content=output.getvalue(), headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.post("/import/excel")
async def importar_licencias_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Importar licencias masivamente ignorando la fila de ejemplo."""
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden importar licencias.")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))
    
    required_cols = ["Nombre", "Categoría"]
    for col in required_cols:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Falta la columna requerida: {col}")

    proveedores = {p.nombre.lower(): p.id for p in db.query(Proveedor).all()}
    
    errores = []
    importados = 0

    for index, row in df.iterrows():
        try:
            nombre = str(row["Nombre"]).strip()
            if not nombre or nombre == "nan" or "EJEMPLO" in nombre.upper(): continue
            
            # Mapeo de Proveedor
            prov_nombre = str(row.get("Proveedor", "")).strip().lower()
            proveedor_id = proveedores.get(prov_nombre)

            # Preparar data
            lic_data = {
                "nombre": nombre,
                "categoria": str(row["Categoría"]).strip(),
                "llave": str(row.get("Llave / Key", "")).strip() if pd.notna(row.get("Llave / Key")) else None,
                "proveedor_id": proveedor_id,
                "asientos_totales": int(row.get("Asientos Totales", 1)) if pd.notna(row.get("Asientos Totales")) else 1,
                "costo_anual": float(row.get("Costo Anual", 0)) if pd.notna(row.get("Costo Anual")) else 0.0,
                "estatus": "Vigente",
                "historial": [{
                    "fecha": datetime.utcnow().isoformat(),
                    "usuario": current_user.nombre_completo,
                    "evento": "Importación Masiva",
                    "notas": "Licencia cargada vía Excel"
                }]
            }

            if pd.notna(row.get("Fecha Vencimiento")):
                try:
                    lic_data["fecha_vencimiento"] = pd.to_datetime(row["Fecha Vencimiento"]).date()
                except: pass

            nueva_licencia = Licencia(**lic_data)
            db.add(nueva_licencia)
            importados += 1
            
        except Exception as e:
            errores.append(f"Fila {index+2}: Error inesperado - {str(e)}")

    db.commit()
    
    return {
        "status": "completado",
        "importados": importados,
        "errores": errores
    }

# Crear directorio para documentos si no existe
os.makedirs("uploads/licencias", exist_ok=True)

@router.post("/", response_model=LicenciaResponse)
def crear_licencia(licencia_in: LicenciaCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para registrar licencias.")

    # Inicializar historial
    hist = [{
        "fecha": str(date.today()),
        "evento": "Alta de Registro",
        "usuario": current_user.nombre_completo,
        "notas": f"Licencia '{licencia_in.nombre}' registrada en el sistema."
    }]

    nueva_licencia = Licencia(**licencia_in.model_dump(), estatus="Vigente", historial=hist)
    db.add(nueva_licencia)
    db.commit()
    db.refresh(nueva_licencia)
    return nueva_licencia

@router.get("/", response_model=List[LicenciaResponse])
def listar_licencias(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    return db.query(Licencia).order_by(Licencia.fecha_vencimiento.asc()).all()

@router.put("/{licencia_id}", response_model=LicenciaResponse)
def actualizar_licencia(licencia_id: int, licencia_in: LicenciaUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar licencias.")

    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    if not licencia:
        raise HTTPException(status_code=404, detail="Licencia no encontrada.")

    update_data = licencia_in.model_dump(exclude_unset=True)

    # Manejar historial si se envía (ej: Renovaciones)
    actual_historial = list(licencia.historial) if licencia.historial else []
    if "historial" in update_data:
        actual_historial.extend(update_data["historial"])
        del update_data["historial"]
    else:
        # Registro genérico de actualización si no viene historial específico
        actual_historial.append({
            "fecha": str(date.today()),
            "evento": "Actualización de Datos",
            "usuario": current_user.nombre_completo,
            "notas": "Se modificaron los campos generales del registro."
        })

    licencia.historial = actual_historial
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(licencia, "historial")

    for key, value in update_data.items():
        setattr(licencia, key, value)

    db.commit()
    db.refresh(licencia)
    return licencia

@router.delete("/{licencia_id}")
def eliminar_licencia(licencia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden eliminar licencias.")

    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    if not licencia:
        raise HTTPException(status_code=404, detail="No encontrada")

    hist = list(licencia.historial) if licencia.historial else []

    if licencia.is_deleted:
        # Eliminación física si ya estaba en papelera
        db.delete(licencia)
        mensaje = "Licencia eliminada permanentemente"
    else:
        # Soft delete
        licencia.is_deleted = True
        licencia.estatus = "Baja"
        # Liberar activos
        licencia.activos = []
        
        hist.append({
            "fecha": str(date.today()),
            "evento": "Baja de Licencia",
            "usuario": current_user.nombre_completo,
            "notas": "La licencia ha sido movida a la papelera y se han liberado los activos vinculados."
        })
        licencia.historial = hist
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(licencia, "historial")
        
        mensaje = "Licencia movida a la papelera y activos liberados"

    db.commit()
    return {"status": "ok", "message": mensaje}

@router.patch("/{licencia_id}/restaurar", response_model=LicenciaResponse)
def restaurar_licencia(licencia_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos.")

    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    if not licencia:
        raise HTTPException(status_code=404, detail="No encontrada")

    licencia.is_deleted = False
    licencia.estatus = "Vigente"
    
    hist = list(licencia.historial) if licencia.historial else []
    hist.append({
        "fecha": str(date.today()),
        "evento": "Restauración de Licencia",
        "usuario": current_user.nombre_completo,
        "notas": "La licencia ha sido restaurada desde la papelera."
    })
    licencia.historial = hist
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(licencia, "historial")
    
    db.commit()
    db.refresh(licencia)
    return licencia

@router.post("/{licencia_id}/documentos")
def subir_documentos_licencia(
    licencia_id: int, 
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_active_user)
):
    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    if not licencia:
        raise HTTPException(status_code=404, detail="No encontrada")

    docs = list(licencia.documentos) if licencia.documentos else []
    for file in files:
        file_path = f"uploads/licencias/lic_{licencia_id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        docs.append(file_path)

    licencia.documentos = docs
    
    hist = list(licencia.historial) if licencia.historial else []
    hist.append({
        "fecha": str(date.today()),
        "evento": "Documentación Adjunta",
        "usuario": current_user.nombre_completo,
        "notas": f"Se subieron {len(files)} archivo(s) PDF al expediente."
    })
    licencia.historial = hist
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(licencia, "historial")
    
    db.commit()
    return {"status": "ok", "documentos": licencia.documentos}

@router.post("/{licencia_id}/vincular-usuario/{usuario_id}", response_model=LicenciaResponse)
def vincular_usuario(licencia_id: int, usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not licencia or not usuario:
        raise HTTPException(status_code=404, detail="Licencia o Usuario no encontrado")
    
    if licencia.asientos_disponibles <= 0:
        raise HTTPException(status_code=400, detail="No hay asientos disponibles")
        
    if usuario not in licencia.usuarios:
        licencia.usuarios.append(usuario)
        hist = list(licencia.historial) if licencia.historial else []
        hist.append({
            "fecha": str(date.today()),
            "evento": "Asignación de Asiento",
            "usuario": current_user.nombre_completo,
            "notas": f"Licencia asignada al usuario {usuario.nombre_completo}. Asientos restantes: {licencia.asientos_disponibles - 1}"
        })
        licencia.historial = hist
        
    db.commit()
    db.refresh(licencia)
    return licencia

@router.post("/{licencia_id}/desvincular-usuario/{usuario_id}", response_model=LicenciaResponse)
def desvincular_usuario(licencia_id: int, usuario_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not licencia or not usuario:
        raise HTTPException(status_code=404, detail="No encontrado")
        
    if usuario in licencia.usuarios:
        licencia.usuarios.remove(usuario)
        hist = list(licencia.historial) if licencia.historial else []
        hist.append({
            "fecha": str(date.today()),
            "evento": "Desvínculo de Usuario",
            "usuario": current_user.nombre_completo,
            "notas": f"Licencia desvinculada del usuario {usuario.nombre_completo}"
        })
        licencia.historial = hist
        
    db.commit()
    db.refresh(licencia)
    return licencia

@router.post("/{licencia_id}/vincular/{activo_id}", response_model=LicenciaResponse)
def vincular_activo(licencia_id: int, activo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    activo = db.query(Activo).filter(Activo.id == activo_id).first()

    if not licencia or not activo:
        raise HTTPException(status_code=404, detail="Licencia o Activo no encontrado")

    if len(licencia.activos) >= licencia.asientos_totales:
        raise HTTPException(status_code=400, detail="No hay asientos disponibles")

    if activo not in licencia.activos:
        licencia.activos.append(activo)
        # Opcional: registrar en historial
        hist = list(licencia.historial) if licencia.historial else []
        hist.append({
            "fecha": str(date.today()),
            "evento": "Vínculo de Activo",
            "usuario": current_user.nombre_completo,
            "notas": f"Vinculado al activo {activo.codigo}"
        })
        licencia.historial = hist

    db.commit()
    db.refresh(licencia)
    return licencia

@router.post("/{licencia_id}/desvincular/{activo_id}", response_model=LicenciaResponse)
def desvincular_activo(licencia_id: int, activo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_active_user)):
    licencia = db.query(Licencia).filter(Licencia.id == licencia_id).first()
    activo = db.query(Activo).filter(Activo.id == activo_id).first()

    if not licencia or not activo:
        raise HTTPException(status_code=404, detail="No encontrado")

    if activo in licencia.activos:
        licencia.activos.remove(activo)
        hist = list(licencia.historial) if licencia.historial else []
        hist.append({
            "fecha": str(date.today()),
            "evento": "Desvínculo de Activo",
            "usuario": current_user.nombre_completo,
            "notas": f"Desvinculado del activo {activo.codigo}"
        })
        licencia.historial = hist

    db.commit()
    db.refresh(licencia)
    return licencia