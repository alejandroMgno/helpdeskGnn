from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import pandas as pd
import io
from app.api.dependencies import get_db, get_current_user
from app.models.activo import Activo
from app.models.usuario import Usuario

router = APIRouter()

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_excel_activos(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    # Solo permitimos que el Admin use esta función
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx)")

    try:
        # Leer el Excel
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validar columnas necesarias
        required_cols = ['etiqueta_gnn', 'nombre', 'serie', 'categoria', 'marca', 'modelo']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail=f"El Excel debe tener las columnas: {required_cols}")

        activos_creados = 0
        for _, row in df.iterrows():
            # Evitar duplicados por etiqueta
            existe = db.query(Activo).filter(Activo.etiqueta_gnn == str(row['etiqueta_gnn'])).first()
            if not existe:
                nuevo_activo = Activo(
                    etiqueta_gnn=str(row['etiqueta_gnn']),
                    nombre=str(row['nombre']),
                    serie=str(row['serie']),
                    categoria=str(row['categoria']),
                    marca=str(row['marca']),
                    modelo=str(row['modelo']),
                    status="activo"
                )
                db.add(nuevo_activo)
                activos_creados += 1
        
        db.commit()
        return {"message": f"Se cargaron {activos_creados} activos correctamente."}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar el Excel: {str(e)}")