from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
import os
import shutil
from datetime import datetime, timedelta

from app.api.dependencies import get_db, get_current_user
from app.models.activo import Activo, ProgramaMantenimiento, Marca, Proveedor
from app.models.usuario import Usuario, RolUsuario
from app.schemas.activo import ActivoCreate

router = APIRouter()

@router.get("/")
def obtener_activos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    activos_db = db.query(Activo).filter(Activo.is_deleted == False).all()
    resultados = []
    for a in activos_db:
        prox_mant = "N/A"
        if a.mantenimientos:
            prog = a.mantenimientos[0] if isinstance(a.mantenimientos, list) else a.mantenimientos
            if prog and prog.proxima_fecha:
                prox_mant = prog.proxima_fecha.strftime("%d/%m/%Y")
        
        resultados.append({
            "id": a.id,
            "etiqueta": a.etiqueta_gnn,
            "nombre": a.nombre,
            "serie": a.serie,
            "categoria": a.categoria.lower() if a.categoria else "computadoras",
            "usuario": a.usuario_asignado.nombre if a.usuario_asignado else "Sin Asignar",
            "departamento": a.usuario_asignado.departamento if a.usuario_asignado else "N/A",
            "zona": a.usuario_asignado.zona if a.usuario_asignado else "N/A",
            "marca": a.marca.nombre if a.marca else "N/A",
            "proveedor": a.proveedor.nombre if a.proveedor else "N/A",
            "factura": a.factura_url,
            "status": a.status,
            "prox_mant": prox_mant
        })
    return resultados

@router.post("/")
def crear_activo(activo_in: ActivoCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol not in [RolUsuario.ADMIN, RolUsuario.TECNICO]:
        raise HTTPException(status_code=403, detail="No tienes permisos para agregar activos")

    existe = db.query(Activo).filter(Activo.etiqueta_gnn == activo_in.etiqueta_gnn).first()
    if existe:
        raise HTTPException(status_code=400, detail="La etiqueta GNN ya está registrada")

    nuevo_activo = Activo(
        etiqueta_gnn=activo_in.etiqueta_gnn,
        nombre=activo_in.nombre,
        serie=activo_in.serie,
        categoria=activo_in.categoria.lower(),
        status=activo_in.status,
        usuario_id=activo_in.usuario_id,
        marca_id=activo_in.marca_id,
        proveedor_id=activo_in.proveedor_id
    )
    db.add(nuevo_activo)
    db.commit()
    db.refresh(nuevo_activo)

    if activo_in.frecuencia_meses and activo_in.frecuencia_meses > 0:
        hoy = datetime.utcnow()
        proxima = hoy + timedelta(days=30 * activo_in.frecuencia_meses)
        programa = ProgramaMantenimiento(
            activo_id=nuevo_activo.id, frecuencia_meses=activo_in.frecuencia_meses,
            fecha_inicio=hoy, proxima_fecha=proxima
        )
        db.add(programa)
        db.commit()

    return {"message": "Activo creado con éxito", "id": nuevo_activo.id}

# 🔴 NUEVO ENDPOINT: SUBIR FACTURA PDF
@router.post("/{activo_id}/factura")
async def subir_factura(activo_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="La factura debe ser un archivo PDF")
    
    activo = db.query(Activo).filter(Activo.id == activo_id).first()
    if not activo:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    # Crear carpeta si no existe
    upload_dir = "uploads/facturas"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/factura_{activo.etiqueta_gnn}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    activo.factura_url = file_path
    db.commit()
    
    return {"message": "Factura subida correctamente", "url": file_path}

# (Tu endpoint de /upload excel se mantiene igual aquí abajo)