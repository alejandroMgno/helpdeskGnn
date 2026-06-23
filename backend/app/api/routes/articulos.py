
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api.dependencies import get_db
from app.models.articulo import Articulo, VisibilidadArticulo
from app.schemas.articulo import ArticuloResponse, ArticuloCreate, ArticuloUpdate
from app.api.dependencies import get_current_user
from app.models.usuario import Usuario, RolUsuario

router = APIRouter()

@router.get("/", response_model=List[ArticuloResponse])
def obtener_articulos(db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    query = db.query(Articulo)
    
    # Si es usuario normal, forzamos a que solo vea los Externos
    if current_user.rol == RolUsuario.Usuario:
        query = query.filter(Articulo.visibilidad == VisibilidadArticulo.Externo)
        
    return query.order_by(Articulo.fecha_creacion.desc()).all()

@router.post("/", response_model=ArticuloResponse)
def crear_articulo(articulo: ArticuloCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol == RolUsuario.Usuario:
        raise HTTPException(status_code=403, detail="No tienes permisos para publicar artículos")
        
    nuevo_articulo = Articulo(**articulo.model_dump(), autor_id=current_user.id)
    db.add(nuevo_articulo)
    db.commit()
    db.refresh(nuevo_articulo)
    return nuevo_articulo

@router.put("/{articulo_id}", response_model=ArticuloResponse)
def actualizar_articulo(articulo_id: int, articulo: ArticuloUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    if current_user.rol == RolUsuario.Usuario:
        raise HTTPException(status_code=403, detail="No tienes permisos para editar artículos")
        
    db_articulo = db.query(Articulo).filter(Articulo.id == articulo_id).first()
    if not db_articulo:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
        
    update_data = articulo.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_articulo, key, value)
        
    db.commit()
    db.refresh(db_articulo)
    return db_articulo

@router.post("/{articulo_id}/vistas")
def incrementar_vistas(articulo_id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    db_articulo = db.query(Articulo).filter(Articulo.id == articulo_id).first()
    if db_articulo:
        db_articulo.vistas += 1
        db.commit()
    return {"status": "ok"}