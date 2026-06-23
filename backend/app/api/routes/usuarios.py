# backend/app/api/routes/usuarios.py
import pandas as pd
import io
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, BackgroundTasks
from sqlalchemy.orm import Session
import secrets
from app.api.dependencies import get_db, get_current_active_user
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.models.usuario import Usuario, StatusTecnico, RolUsuario, HorarioLaboral
from app.core.security import get_password_hash
from app.services.email_service import enviar_email
from app.core.config import settings
from datetime import datetime
from app.services.websocket_manager import manager

router = APIRouter()

@router.get("/export/excel")
def exportar_usuarios_excel(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Exportar todo el directorio de usuarios a Excel con fila de ejemplo."""
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden exportar el directorio.")

    usuarios = db.query(Usuario).filter(Usuario.is_active == True).all()
    
    data = []
    
    # --- FILA DE EJEMPLO (GUÍA) ---
    data.append({
        "ID": "EJEMPLO",
        "Nombre Completo": "Nombre del Colaborador",
        "Email": "correo@empresa.com",
        "Rol": f"VALORES: {[r.value for r in RolUsuario]}",
        "Departamento": "Ej: Sistemas, Ventas",
        "Puesto": "Ej: Analista, Gerente",
        "Zona": "Ej: Norte, Bajío",
        "Ciudad": "Ej: CDMX",
        "Estado": "Ej: CDMX",
        "Celular Red": "Ej: 5512345678",
        "Empresa": "Nombre Empresa",
        "No Empleado": "001",
        "Fecha Creación": "AAAA-MM-DD"
    })

    for u in usuarios:
        data.append({
            "ID": u.id,
            "Nombre Completo": u.nombre_completo,
            "Email": u.email,
            "Rol": u.rol.value,
            "Departamento": u.departamento,
            "Puesto": u.puesto,
            "Zona": u.zona,
            "Ciudad": u.ciudad,
            "Estado": u.estado,
            "Celular Red": u.celular_red,
            "Empresa": u.empresa,
            "No Empleado": u.no_empleado,
            "Fecha Creación": u.fecha_creacion.strftime("%Y-%m-%d") if u.fecha_creacion else "N/A"
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Directorio')
    
    output.seek(0)
    headers = {
        'Content-Disposition': f'attachment; filename="directorio_gnn_{datetime.now().strftime("%Y%m%d")}.xlsx"'
    }
    return Response(content=output.getvalue(), headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@router.post("/import/excel")
async def importar_usuarios_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Importar usuarios masivamente ignorando la fila de ejemplo."""
    if current_user.rol != RolUsuario.Admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden importar usuarios.")

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="El archivo debe ser un Excel (.xlsx o .xls)")

    contents = await file.read()
    df = pd.read_excel(io.BytesIO(contents))
    
    required_cols = ["Nombre Completo", "Email", "Rol"]
    for col in required_cols:
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Falta la columna requerida: {col}")

    roles_validos = {r.value: r for r in RolUsuario}
    
    errores = []
    importados = 0

    for index, row in df.iterrows():
        try:
            email = str(row["Email"]).strip().lower()
            if not email or email == "nan" or "EJEMPLO" in email.upper(): continue
            
            # Verificar si ya existe
            existente = db.query(Usuario).filter(Usuario.email == email).first()
            if existente:
                errores.append(f"Fila {index+2}: El email '{email}' ya está registrado.")
                continue

            rol_str = str(row["Rol"]).strip()
            rol_enum = roles_validos.get(rol_str, RolUsuario.Usuario)

            # Preparar data
            user_data = {
                "email": email,
                "nombre_completo": str(row["Nombre Completo"]).strip(),
                "rol": rol_enum,
                "hashed_password": get_password_hash("gnn12345"), # Password temporal por defecto
                "departamento": str(row.get("Departamento", "Sistemas")).strip() if pd.notna(row.get("Departamento")) else "Sistemas",
                "puesto": str(row.get("Puesto", "")).strip() if pd.notna(row.get("Puesto")) else None,
                "zona": str(row.get("Zona", "")).strip() if pd.notna(row.get("Zona")) else None,
                "ciudad": str(row.get("Ciudad", "")).strip() if pd.notna(row.get("Ciudad")) else None,
                "estado": str(row.get("Estado", "")).strip() if pd.notna(row.get("Estado")) else None,
                "celular_red": str(row.get("Celular Red", "")).strip() if pd.notna(row.get("Celular Red")) else None,
                "empresa": str(row.get("Empresa", "")).strip() if pd.notna(row.get("Empresa")) else None,
                "no_empleado": str(row.get("No Empleado", "")).strip() if pd.notna(row.get("No Empleado")) else None,
                "is_active": True
            }

            nuevo_usuario = Usuario(**user_data)
            db.add(nuevo_usuario)
            importados += 1
            
        except Exception as e:
            errores.append(f"Fila {index+2}: Error inesperado - {str(e)}")

    db.commit()
    
    return {
        "status": "completado",
        "importados": importados,
        "errores": errores
    }

@router.get("/", response_model=List[UsuarioResponse])
def read_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener todos los usuarios."""
    usuarios = db.query(Usuario).offset(skip).limit(limit).all()
    return usuarios

@router.post("/", response_model=UsuarioResponse)
def create_usuario(
    user_in: UsuarioCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Crear un nuevo usuario."""
    # Candado de creación
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes permisos para crear usuarios.")

    usuario = db.query(Usuario).filter(Usuario.email == user_in.email).first()
    if usuario:
        raise HTTPException(status_code=400, detail="El email ya está registrado en el sistema.")
    
    user_data = user_in.model_dump(exclude={"password"})
    user_data["hashed_password"] = get_password_hash(user_in.password)
    
    # Generar token de verificación
    verification_token = secrets.token_urlsafe(32)
    user_data["email_verification_token"] = verification_token
    user_data["is_email_verified"] = False
    
    nuevo_usuario = Usuario(**user_data)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Enviar correo de verificación
    verification_link = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
    html = f"""
    <html>
        <body>
            <h2>Bienvenido a {settings.PROJECT_NAME}</h2>
            <p>Por favor, haz clic en el siguiente enlace para activar tu cuenta:</p>
            <a href="{verification_link}">{verification_link}</a>
        </body>
    </html>
    """
    background_tasks.add_task(enviar_email, nuevo_usuario.email, "Activa tu cuenta", html)
    
    return nuevo_usuario

@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def update_usuario(
    usuario_id: int,
    user_in: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar un usuario y su estado (Poderes de Dios para Admin/Tecnicos)."""
    
    # ✅ CANDADO: Si es un usuario mortal, lo rebotamos.
    if current_user.rol not in [RolUsuario.Admin, RolUsuario.Tecnico]:
        raise HTTPException(status_code=403, detail="No tienes el rango necesario para modificar usuarios.")

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user_in.model_dump(exclude_unset=True)
    
    # ✅ Manejo de Horarios
    if "horarios" in update_data:
        horarios_data = update_data.pop("horarios")
        if horarios_data is not None:
            # Limpiar horarios previos
            db.query(HorarioLaboral).filter(HorarioLaboral.usuario_id == usuario_id).delete()
            # Insertar nuevos
            for h_dict in horarios_data:
                nuevo_h = HorarioLaboral(usuario_id=usuario_id, **h_dict)
                db.add(nuevo_h)

    # ✅ Lógica de Reseteo de Password
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    elif "password" in update_data:
        update_data.pop("password") # Si lo mandan vacío, lo ignoramos

    # ✅ Actualizamos status_tecnico y ausente
    if "status_tecnico" in update_data and update_data["status_tecnico"]:
        nuevo_status = update_data["status_tecnico"]
        # Consideramos ausente si explícitamente es Ausente, Fuera de Oficina o Vacaciones
        if nuevo_status in [StatusTecnico.Ausente, StatusTecnico.Fuera_de_Oficina, StatusTecnico.Vacaciones, "Ausente", "Fuera_de_Oficina", "Vacaciones"]:
            update_data["ausente"] = True
        else:
            update_data["ausente"] = False
        
        # Aseguramos que sea el valor del Enum
        try:
            update_data["status_tecnico"] = StatusTecnico(nuevo_status)
        except ValueError:
            # Si mandan algo raro, por lo menos no rompemos
            pass
    
    # Aplicar cambios al modelo
    for field, value in update_data.items():
        setattr(usuario, field, value)
        
    db.commit()
    db.refresh(usuario)

    # 🚀 NOTIFICAR AL DASHBOARD EN TIEMPO REAL
    await manager.broadcast_global({"type": "update_dashboard"})
        
    return usuario
