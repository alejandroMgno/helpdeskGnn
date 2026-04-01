from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional

class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str
    rol: str = "usuario"
    zona: Optional[str] = None
    departamento: Optional[str] = None
    centro_costo: Optional[str] = None
    status: str = "activo"
    tecnico_preferente_id: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    is_active: bool
    
    # Esto elimina el warning de 'orm_mode'
    model_config = ConfigDict(from_attributes=True)

# Necesario para que funcione el login y la validación de seguridad
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None