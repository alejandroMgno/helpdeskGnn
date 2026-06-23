# backend/app/schemas/usuario.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.usuario import RolUsuario, StatusTecnico, EstatusUsuario

class HorarioLaboralBase(BaseModel):
    dia_semana: int
    es_laboral: bool = True
    hora_inicio_1: Optional[str] = None
    hora_fin_1: Optional[str] = None
    hora_inicio_2: Optional[str] = None
    hora_fin_2: Optional[str] = None

class HorarioLaboralCreate(HorarioLaboralBase):
    pass

class HorarioLaboralResponse(HorarioLaboralBase):
    id: int
    usuario_id: int

    class Config:
        from_attributes = True

class UsuarioBase(BaseModel):
    nombre_completo: str
    email: EmailStr
    rol: RolUsuario = RolUsuario.Usuario
    zona: Optional[str] = None
    departamento: Optional[str] = None
    centro_costo: Optional[str] = None
    especialidad: Optional[str] = None
    
    # --- NUEVOS CAMPOS ---
    empresa: Optional[str] = None
    no_empleado: Optional[str] = None
    fecha_ingreso: Optional[datetime] = None
    subdepartamento: Optional[str] = None
    puesto: Optional[str] = None
    proyecto: Optional[str] = None
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    razon_social: Optional[str] = None
    registro_patronal: Optional[str] = None
    razon_social_pagadora: Optional[str] = None
    no_banca: Optional[str] = None
    banco_pagador: Optional[str] = None
    correo_personal: Optional[str] = None
    celular_personal: Optional[str] = None
    celular_red: Optional[str] = None
    imss: Optional[str] = None
    rfc: Optional[str] = None
    curp: Optional[str] = None
    fecha_nacimiento: Optional[datetime] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None

    estatus: Optional[EstatusUsuario] = EstatusUsuario.Activo
    status_tecnico: Optional[StatusTecnico] = StatusTecnico.Activo

    ausente: Optional[bool] = False
    tecnico_principal_id: Optional[int] = None
    tecnico_secundario_id: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[RolUsuario] = None
    zona: Optional[str] = None
    departamento: Optional[str] = None
    centro_costo: Optional[str] = None
    especialidad: Optional[str] = None
    password: Optional[str] = None
    
    # --- NUEVOS CAMPOS ---
    empresa: Optional[str] = None
    no_empleado: Optional[str] = None
    fecha_ingreso: Optional[datetime] = None
    subdepartamento: Optional[str] = None
    puesto: Optional[str] = None
    proyecto: Optional[str] = None
    ciudad: Optional[str] = None
    estado: Optional[str] = None
    razon_social: Optional[str] = None
    registro_patronal: Optional[str] = None
    razon_social_pagadora: Optional[str] = None
    no_banca: Optional[str] = None
    banco_pagador: Optional[str] = None
    correo_personal: Optional[str] = None
    celular_personal: Optional[str] = None
    celular_red: Optional[str] = None
    imss: Optional[str] = None
    rfc: Optional[str] = None
    curp: Optional[str] = None
    fecha_nacimiento: Optional[datetime] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None

    estatus: Optional[EstatusUsuario] = None
    status_tecnico: Optional[StatusTecnico] = None
    
    ausente: Optional[bool] = None
    tecnico_principal_id: Optional[int] = None
    tecnico_secundario_id: Optional[int] = None
    horarios: Optional[List[HorarioLaboralBase]] = None

class LicenciaEnUsuario(BaseModel):
    id: int
    nombre: str
    categoria: str
    estatus: str

    class Config:
        from_attributes = True

class UsuarioResponse(UsuarioBase):
    id: int
    is_active: bool
    debe_cambiar_password: bool
    fecha_creacion: datetime
    licencias: List[LicenciaEnUsuario] = []
    horarios: List[HorarioLaboralResponse] = []

    class Config:
        from_attributes = True
