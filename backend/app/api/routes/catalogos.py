from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_active_user
from app.models.usuario import RolUsuario
from app.models.catalogos import Marca, Proveedor, SLAConfig, CategoriaActivo, Zona, CentroCosto, Departamento, Puesto, ModeloParte
from app.schemas.catalogos import (
    MarcaCreate, MarcaResponse, 
    ProveedorCreate, ProveedorResponse,
    SLAConfigCreate, SLAConfigResponse,
    CategoriaCreate, CategoriaResponse,
    ZonaCreate, ZonaResponse,
    CentroCostoCreate, CentroCostoResponse,
    PuestoCreate, PuestoResponse,
    DepartamentoCreate, DepartamentoResponse,
    ModeloParteCreate, ModeloParteResponse
)

router = APIRouter()

# --- ZONAS ---
@router.post("/zonas", response_model=ZonaResponse)
def crear_zona(zona_in: ZonaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_zona = Zona(**zona_in.model_dump())
    db.add(db_zona)
    db.commit()
    db.refresh(db_zona)
    return db_zona

@router.get("/zonas", response_model=List[ZonaResponse])
def listar_zonas(db: Session = Depends(get_db)):
    return db.query(Zona).all()

@router.put("/zonas/{id}", response_model=ZonaResponse)
def actualizar_zona(id: int, zona_in: ZonaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(Zona).filter(Zona.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrada")
    db_obj.nombre = zona_in.nombre
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/zonas/{id}")
def eliminar_zona(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(Zona).filter(Zona.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrada")
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}

# --- CENTROS DE COSTO ---
@router.post("/centros-costo", response_model=CentroCostoResponse)
def crear_centro_costo(cc_in: CentroCostoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_cc = CentroCosto(**cc_in.model_dump())
    db.add(db_cc)
    db.commit()
    db.refresh(db_cc)
    return db_cc

@router.get("/centros-costo", response_model=List[CentroCostoResponse])
def listar_centros_costo(db: Session = Depends(get_db)):
    return db.query(CentroCosto).all()

@router.put("/centros-costo/{id}", response_model=CentroCostoResponse)
def actualizar_centro_costo(id: int, cc_in: CentroCostoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(CentroCosto).filter(CentroCosto.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    db_obj.codigo = cc_in.codigo
    db_obj.nombre = cc_in.nombre
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/centros-costo/{id}")
def eliminar_centro_costo(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(CentroCosto).filter(CentroCosto.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrada")
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}

# --- DEPARTAMENTOS ---
@router.post("/departamentos", response_model=DepartamentoResponse)
def crear_departamento(dep_in: DepartamentoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_dep = Departamento(**dep_in.model_dump())
    db.add(db_dep)
    db.commit()
    db.refresh(db_dep)
    return db_dep

@router.get("/departamentos", response_model=List[DepartamentoResponse])
def listar_departamentos(db: Session = Depends(get_db)):
    return db.query(Departamento).all()

@router.put("/departamentos/{id}", response_model=DepartamentoResponse)
def actualizar_departamento(id: int, dep_in: DepartamentoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(Departamento).filter(Departamento.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    db_obj.nombre = dep_in.nombre
    db_obj.zona_id = dep_in.zona_id
    db_obj.centro_costo_id = dep_in.centro_costo_id
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/departamentos/{id}")
def eliminar_departamento(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(Departamento).filter(Departamento.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrada")
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}

# --- PUESTOS ---
@router.post("/puestos", response_model=PuestoResponse)
def crear_puesto(puesto_in: PuestoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_puesto = Puesto(**puesto_in.model_dump())
    db.add(db_puesto)
    db.commit()
    db.refresh(db_puesto)
    return db_puesto

@router.get("/puestos", response_model=List[PuestoResponse])
def listar_puestos(db: Session = Depends(get_db)):
    return db.query(Puesto).all()

@router.put("/puestos/{id}", response_model=PuestoResponse)
def actualizar_puesto(id: int, puesto_in: PuestoCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(Puesto).filter(Puesto.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    db_obj.nombre = puesto_in.nombre
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.delete("/puestos/{id}")
def eliminar_puesto(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(Puesto).filter(Puesto.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrada")
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}

# --- MARCAS ---
@router.post("/marcas", response_model=MarcaResponse)
def crear_marca(marca_in: MarcaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_marca = Marca(**marca_in.model_dump())
    db.add(db_marca)
    db.commit()
    db.refresh(db_marca)
    return db_marca

@router.get("/marcas", response_model=List[MarcaResponse])
def listar_marcas(db: Session = Depends(get_db)):
    return db.query(Marca).all()

@router.put("/marcas/{marca_id}", response_model=MarcaResponse)
def actualizar_marca(marca_id: int, marca_in: MarcaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_marca = db.query(Marca).filter(Marca.id == marca_id).first()
    if not db_marca:
        raise HTTPException(status_code=404, detail="No encontrada")
    for field, value in marca_in.model_dump().items():
        setattr(db_marca, field, value)
    db.commit()
    db.refresh(db_marca)
    return db_marca

@router.delete("/marcas/{marca_id}")
def eliminar_marca(marca_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_marca = db.query(Marca).filter(Marca.id == marca_id).first()
    if not db_marca:
        raise HTTPException(status_code=404, detail="No encontrada")
    db.delete(db_marca)
    db.commit()
    return {"status": "deleted"}

# --- PROVEEDORES ---
@router.post("/proveedores", response_model=ProveedorResponse)
def crear_proveedor(proveedor_in: ProveedorCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_proveedor = Proveedor(**proveedor_in.model_dump())
    db.add(db_proveedor)
    db.commit()
    db.refresh(db_proveedor)
    return db_proveedor

@router.get("/proveedores", response_model=List[ProveedorResponse])
def listar_proveedores(db: Session = Depends(get_db)):
    return db.query(Proveedor).all()

@router.put("/proveedores/{prov_id}", response_model=ProveedorResponse)
def actualizar_proveedor(prov_id: int, prov_in: ProveedorCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_prov = db.query(Proveedor).filter(Proveedor.id == prov_id).first()
    if not db_prov:
        raise HTTPException(status_code=404, detail="No encontrada")
    for field, value in prov_in.model_dump().items():
        setattr(db_prov, field, value)
    db.commit()
    db.refresh(db_prov)
    return db_prov

@router.delete("/proveedores/{prov_id}")
def eliminar_proveedor(prov_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_prov = db.query(Proveedor).filter(Proveedor.id == prov_id).first()
    if not db_prov:
        raise HTTPException(status_code=404, detail="No encontrada")
    db.delete(db_prov)
    db.commit()
    return {"status": "deleted"}

# --- SLA CONFIG ---
@router.get("/sla", response_model=List[SLAConfigResponse])
def listar_sla_configs(db: Session = Depends(get_db)):
    return db.query(SLAConfig).all()

@router.put("/sla/{config_id}", response_model=SLAConfigResponse)
def actualizar_sla_config(
    config_id: int, 
    config_in: SLAConfigCreate, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_active_user)
):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    db_config = db.query(SLAConfig).filter(SLAConfig.id == config_id).first()
    if not db_config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    
    for field, value in config_in.model_dump().items():
        setattr(db_config, field, value)
    
    db.commit()
    db.refresh(db_config)
    return db_config

@router.post("/sla/seed")
def seed_sla_configs(db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    
    # Solo si no hay configuraciones
    if db.query(SLAConfig).count() > 0:
        return {"msg": "Ya existen configuraciones de SLA"}
    
    configs = [
        SLAConfig(prioridad="Crítica", horas=2, descripcion="Soporte inmediato. Detención total de operaciones."),
        SLAConfig(prioridad="Alta", horas=8, descripcion="Problemas graves que afectan la productividad."),
        SLAConfig(prioridad="Media", horas=24, descripcion="Problemas estándar con alternativas temporales."),
        SLAConfig(prioridad="Baja", horas=72, descripcion="Consultas generales o solicitudes de mejora.")
    ]
    db.add_all(configs)
    db.commit()
    return {"msg": "Configuraciones iniciales de SLA creadas"}

# --- CATEGORÍAS ---
@router.post("/categorias", response_model=CategoriaResponse)
def crear_categoria(cat_in: CategoriaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_cat = CategoriaActivo(**cat_in.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.get("/categorias", response_model=List[CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(CategoriaActivo).all()

@router.put("/categorias/{cat_id}", response_model=CategoriaResponse)
def actualizar_categoria(cat_id: int, cat_in: CategoriaCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_cat = db.query(CategoriaActivo).filter(CategoriaActivo.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="No encontrada")
    for field, value in cat_in.model_dump().items():
        setattr(db_cat, field, value)
    db.commit()
    db.refresh(db_cat)
    return db_cat

@router.delete("/categorias/{cat_id}")
def eliminar_categoria(cat_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_cat = db.query(CategoriaActivo).filter(CategoriaActivo.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="No encontrada")
    db.delete(db_cat)
    db.commit()
    return {"status": "deleted"}

# --- MODELOS DE PARTE (NÚMERO DE PARTE) ---
@router.post("/modelos-parte", response_model=ModeloParteResponse)
def crear_modelo_parte(modelo_in: ModeloParteCreate, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    db_modelo = ModeloParte(**modelo_in.model_dump())
    db.add(db_modelo)
    db.commit()
    db.refresh(db_modelo)
    return db_modelo

@router.get("/modelos-parte", response_model=List[ModeloParteResponse])
def listar_modelos_parte(db: Session = Depends(get_db)):
    return db.query(ModeloParte).all()

@router.get("/modelos-parte/search/{numero_parte}", response_model=ModeloParteResponse)
def obtener_modelo_parte_por_numero(numero_parte: str, db: Session = Depends(get_db)):
    db_modelo = db.query(ModeloParte).filter(ModeloParte.numero_parte == numero_parte).first()
    if not db_modelo:
        raise HTTPException(status_code=404, detail="Número de parte no encontrado en el catálogo")
    return db_modelo

@router.delete("/modelos-parte/{id}")
def eliminar_modelo_parte(id: int, db: Session = Depends(get_db), current_user = Depends(get_current_active_user)):
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores")
    db_obj = db.query(ModeloParte).filter(ModeloParte.id == id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.delete(db_obj)
    db.commit()
    return {"status": "deleted"}
