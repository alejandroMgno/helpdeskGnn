from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.core.config import settings
from app.core import security
from app.models.usuario import Usuario # Asegúrate de tener este modelo creado
from app.schemas.usuario import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(Usuario).filter(Usuario.id == token_data.sub).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

# Guardián adicional para requerir rol de Admin o Técnico
def get_current_active_admin_or_tech(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol not in ["admin", "tecnico"]:
        raise HTTPException(status_code=403, detail="Privilegios insuficientes")
    return current_user