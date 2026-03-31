from pydantic import BaseModel, EmailStr
from typing import Optional

# Propiedades compartidas
class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str
    rol: str = "usuario" # admin, tecnico, usuario
    zona: Optional[str] = None
    departamento: Optional[str] = None
    status: str = "activo"

# Para crear un usuario (recibe password)
class UsuarioCreate(UsuarioBase):
    password: str

# Para devolver el usuario (oculta el password)
class UsuarioResponse(UsuarioBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

# Esquema para el Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[int] = None