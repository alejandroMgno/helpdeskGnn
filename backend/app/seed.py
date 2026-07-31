from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db.base_class import Base

# Importar todos los modelos para que SQLAlchemy los reconozca
from app.models.usuario import Usuario, RolUsuario, StatusTecnico, EstatusUsuario
from app.models.ticket import Ticket, PrioridadTicket, EstatusTicket, Comentario
from app.models.activo import Activo, TipoActivo, EstatusActivo, Mantenimiento
from app.models.licencia import Licencia
from app.models.catalogos import Marca, Proveedor, Zona, CentroCosto, Departamento, Puesto, ModeloParte, CategoriaActivo, SLAConfig
from app.models.documento import DocumentoActivo
from app.models.documento_licencia import DocumentoLicencia
from app.models.auditoria import RegistroAuditoria

from app.core.security import get_password_hash

# Crear tablas
Base.metadata.create_all(bind=engine)

def poblar_bd():
    db = SessionLocal()
    try:
        # 1. Limpiar BD
        print("🧹 Limpiando base de datos...")
        # Nota: Ajustar orden según dependencias de Foreign Key si es necesario
        db.query(Ticket).delete()
        db.query(Activo).delete()
        db.query(Licencia).delete()
        db.query(Usuario).delete()
        db.commit()

        # 2. Crear Admin
        print("👥 Creando Administrador...")
        admin = Usuario(
            nombre_completo="Administrador GNN",
            email="admin@gnn.com",
            hashed_password=get_password_hash("admin123"),
            rol=RolUsuario.Admin,
            estatus=EstatusUsuario.Activo,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        # 3. Crear 10 datos ficticios (Usuarios y Activos relacionados)
        print("💻 Creando datos ficticios...")
        for i in range(1, 11):
            user = Usuario(
                nombre_completo=f"Usuario Ficticio {i}",
                email=f"usuario{i}@gnn.com",
                hashed_password=get_password_hash("123456"),
                rol=RolUsuario.Usuario,
                estatus=EstatusUsuario.Activo,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            activo = Activo(
                codigo=f"ACT-{100+i}",
                nombre=f"Equipo {i}",
                tipo=TipoActivo.Computo,
                estatus=EstatusActivo.Asignado,
                usuario_id=user.id
            )
            db.add(activo)
        
        db.commit()
        print("\n✅ Base de datos poblada con 10 registros.")
        print("🔑 Admin: admin@gnn.com / admin123")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_bd()
