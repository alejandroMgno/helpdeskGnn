from sqlalchemy import Column, Integer, String, Float, JSON, Date, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# Tabla de asociación para la relación Muchos a Muchos entre Usuarios y Licencias
usuario_licencia = Table(
    "usuario_licencia",
    Base.metadata,
    Column("usuario_id", Integer, ForeignKey("usuarios.id"), primary_key=True),
    Column("licencia_id", Integer, ForeignKey("licencias.id"), primary_key=True)
)

class Licencia(Base):
    __tablename__ = "licencias"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    categoria = Column(String(100), nullable=False)

    # Soporte para proveedores relacionales
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    proveedor_texto = Column(String(150), nullable=True)

    costo_anual = Column(Float, default=0.0)
    fecha_compra = Column(Date, nullable=True)
    fecha_vencimiento = Column(Date, nullable=True)
    asientos_totales = Column(Integer, default=1)
    llave = Column(String(200), nullable=True)

    estatus = Column(String(50), default="Activa")
    is_deleted = Column(Boolean, default=False)
    documentos = Column(JSON, default=list)

    # Usamos JSON para guardar las listas dinámicas de tu frontend
    asientos_asignados = Column(JSON, default=list) 
    historial = Column(JSON, default=list)

    # Relaciones
    proveedor = relationship("Proveedor")
    activos = relationship("Activo", secondary="activo_licencia", back_populates="licencias")
    usuarios = relationship("Usuario", secondary=usuario_licencia, backref="licencias")

    @property
    def asientos_usados(self):
        # Cada usuario vinculado ocupa 1 asiento
        # (Si aún tienes activos vinculados, también podrías contarlos, pero el usuario pidió migrar a usuarios)
        return len(self.usuarios)

    @property
    def asientos_disponibles(self):
        return max(0, self.asientos_totales - self.asientos_usados)