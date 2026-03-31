from sqlalchemy import Column, String, ForeignKey, Integer  # <--- Agregamos Integer aquí
from sqlalchemy.orm import relationship
from app.db.base_class import AuditBaseModel

class Usuario(AuditBaseModel):
    __tablename__ = "usuarios"
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    rol = Column(String(20), default="usuario") 
    zona = Column(String(50))        
    departamento = Column(String(50)) 
    centro_costo = Column(String(50))
    status = Column(String(20), default="activo") 
    
    # Un usuario puede tener un técnico preferente asignado
    tecnico_preferente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)