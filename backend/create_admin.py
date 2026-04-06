from app.db.database import engine, SessionLocal
from app.db.base_class import Base

# 🔴 IMPORTANTE: Debemos importar TODOS los modelos aquí antes de llamar a create_all()
# para que SQLAlchemy sepa que existen y cree las tablas con las nuevas columnas.
from app.models.usuario import Usuario, RolUsuario, StatusTecnico
from app.models.activo import Activo, Marca, Proveedor, HistorialActivo
from app.models.ticket import Ticket, ComentarioTicket, PrioridadSLA, StatusTicket
from app.models.auditoria import RegistroAuditoria
from app.core.security import get_password_hash

# Esto crea las tablas desde cero con la nueva estructura
Base.metadata.create_all(bind=engine)

def create_admin_user():
    db = SessionLocal()
    try:
        admin = db.query(Usuario).filter(Usuario.email == "admin@gnn.com").first()
        if not admin:
            nuevo_admin = Usuario(
                nombre="Administrador GNN",
                email="admin@gnn.com",
                hashed_password=get_password_hash("admin123"), # Tu contraseña temporal
                rol=RolUsuario.ADMIN,
                status_tecnico=StatusTecnico.ACTIVO,
                zona="Noroeste",
                departamento="Sistemas"
            )
            db.add(nuevo_admin)
            db.commit()
            print("✅ SÚPER ADMIN CREADO CON ÉXITO. Base de datos actualizada.")
        else:
            print("⚠️ El admin ya existe.")
    except Exception as e:
        print(f"❌ Error al crear admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()