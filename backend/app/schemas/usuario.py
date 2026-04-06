# backend/app/schemas/usuario.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date
from app.models.usuario import RolUsuario, EstatusUsuario, StatusTecnico

# Molde Base
class UsuarioBase(BaseModel):
    nombre_completo: str
    email: EmailStr
    zona: Optional[str] = None
    departamento: Optional[str] = None
    centro_costo: Optional[str] = None
    rol: RolUsuario = RolUsuario.Usuario
    estatus: EstatusUsuario = EstatusUsuario.Activo
    status_tecnico: Optional[StatusTecnico] = None
    tecnico_base_id: Optional[int] = None
    tecnico_secundario_id: Optional[int] = None

# Para crear
class UsuarioCreate(UsuarioBase):
    password: str

# Para actualizar (¡Esta es la clase que causaba el error!)
class UsuarioUpdate(UsuarioBase):
    password: Optional[str] = None

# Para responder al Frontend
class UsuarioResponse(UsuarioBase):
    id: int
    fecha_ingreso: date

    class Config:
        from_attributes = True  # En Pydantic v2 se usa from_attributes en lugar de orm_mode