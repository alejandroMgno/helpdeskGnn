# backend/poblar_bd.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.database import SessionLocal, engine
from app.db.base_class import Base

# IMPORTAMOS TODOS LOS MODELOS (Incluyendo el nuevo de Licencia)
from app.models.usuario import Usuario, RolUsuario, StatusTecnico
from app.models.ticket import Ticket, PrioridadTicket, EstatusTicket
from app.models.activo import Activo, TipoActivo, EstatusActivo
from app.models.licencia import Licencia  # <-- Nuevo modelo

from app.core.security import get_password_hash

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

def limpiar_bd(db: Session):
    """Elimina datos existentes respetando orden de dependencias"""
    print("🧹 Limpiando base de datos...")
    db.query(Ticket).delete()
    db.query(Activo).delete()
    db.query(Licencia).delete() # <-- Limpiamos licencias
    db.query(Usuario).delete()
    db.commit()

def crear_usuarios(db: Session):
    print("👥 Creando usuarios...")

    admin = Usuario(
        nombre_completo="Administrador Sistema",
        email="admin@test.com",
        hashed_password=get_password_hash("admin123"),
        rol=RolUsuario.Admin,
        zona="Corporativo",
        departamento="Dirección",
    )

    tecnico1 = Usuario(
        nombre_completo="Ana Gómez",
        email="ana@test.com",
        hashed_password=get_password_hash("123456"),
        rol=RolUsuario.Tecnico,
        status_tecnico=StatusTecnico.Activo,
    )

    tecnico2 = Usuario(
        nombre_completo="Roberto Torres",
        email="roberto@test.com",
        hashed_password=get_password_hash("123456"),
        rol=RolUsuario.Tecnico,
        status_tecnico=StatusTecnico.Ocupado,
    )

    db.add_all([admin, tecnico1, tecnico2])
    db.commit()
    
    db.refresh(tecnico1)
    db.refresh(tecnico2)

    user1 = Usuario(
        nombre_completo="María López",
        email="maria@test.com",
        hashed_password=get_password_hash("123456"),
        rol=RolUsuario.Usuario,
        zona="Corporativo",
        departamento="Contabilidad",
        tecnico_principal_id=tecnico1.id,
        tecnico_secundario_id=tecnico2.id,
    )

    user2 = Usuario(
        nombre_completo="Juan Pérez",
        email="juan@test.com",
        hashed_password=get_password_hash("123456"),
        rol=RolUsuario.Usuario,
        zona="Zona Norte",
        departamento="Ventas",
        tecnico_principal_id=tecnico2.id,
        tecnico_secundario_id=tecnico1.id,
    )

    db.add_all([user1, user2])
    db.commit()

    db.refresh(user1)
    db.refresh(user2)

    return tecnico1, tecnico2, user1, user2

def crear_activos(db: Session, user1: Usuario, user2: Usuario):
    print("💻 Creando activos...")

    activos = [
        Activo(
            codigo="LAP-001",
            nombre="Laptop Dell XPS",
            tipo=TipoActivo.Computo,
            estatus=EstatusActivo.Asignado,
            usuario_id=user1.id,
            # Agregamos la lista de documentos vacía por defecto
            documentos=[] 
        ),
        Activo(
            codigo="MON-002",
            nombre="Monitor LG 27",
            tipo=TipoActivo.Periferico,
            estatus=EstatusActivo.Asignado,
            usuario_id=user2.id,
            documentos=[]
        ),
        Activo(
            codigo="RED-003",
            nombre="Router Cisco",
            tipo=TipoActivo.Red,
            estatus=EstatusActivo.Disponible,
            documentos=["uploads/facturas/factura_global_red.pdf"] # Uno de prueba
        ),
    ]

    db.add_all(activos)
    db.commit()

def crear_licencias(db: Session):
    print("🔑 Creando licencias y suscripciones...")

    licencias = [
        Licencia(
            nombre="Google Workspace Enterprise",
            categoria="Software",
            proveedor="Google",
            costo_anual=12500.0,
            fecha_compra=datetime.now().date() - timedelta(days=365),
            fecha_vencimiento=datetime.now().date() + timedelta(days=30), # Por vencer
            asientos_totales=10,
            llave="Admin Console: corporativo@test.com",
            asientos_asignados=["María López", "Ana Gómez"],
            historial=[{"fecha": "09 Abr 2026", "accion": "Carga Inicial", "usuario": "Sistema", "notas": "Poblamiento de BD"}]
        ),
        Licencia(
            nombre="Adobe Creative Cloud",
            categoria="Software",
            proveedor="Adobe Inc.",
            costo_anual=18000.0,
            fecha_compra=datetime.now().date() - timedelta(days=100),
            fecha_vencimiento=datetime.now().date() + timedelta(days=265),
            asientos_totales=2,
            llave="Login vía email",
            asientos_asignados=["Juan Pérez"],
            historial=[]
        ),
        Licencia(
            nombre="rubiofilms.com",
            categoria="Dominio Web",
            proveedor="GoDaddy",
            costo_anual=450.0,
            fecha_compra=datetime.now().date() - timedelta(days=300),
            fecha_vencimiento=datetime.now().date() - timedelta(days=2), # YA EXPIRADA
            asientos_totales=1,
            llave="DNS gestionado en Cloudflare",
            asientos_asignados=["Sistemas"],
            historial=[]
        )
    ]

    db.add_all(licencias)
    db.commit()

def crear_tickets(db: Session, tecnico1: Usuario, tecnico2: Usuario, user1: Usuario, user2: Usuario):
    print("🎫 Creando tickets...")

    tickets = [
        Ticket(
            titulo="Error en sistema contable",
            descripcion="No carga el dashboard",
            prioridad=PrioridadTicket.Alta,
            estatus=EstatusTicket.Abierto,
            solicitante_id=user1.id,
            tecnico_asignado_id=tecnico1.id,
            fecha_vencimiento_sla=datetime.utcnow() + timedelta(hours=8),
        ),
        Ticket(
            titulo="Equipo no enciende",
            descripcion="Pantalla negra",
            prioridad=PrioridadTicket.Media,
            estatus=EstatusTicket.Abierto,
            solicitante_id=user2.id,
            tecnico_asignado_id=tecnico2.id,
            fecha_vencimiento_sla=datetime.utcnow() + timedelta(hours=24),
        ),
    ]

    db.add_all(tickets)
    db.commit()

def poblar_bd():
    db = SessionLocal()

    try:
        limpiar_bd(db)

        tecnico1, tecnico2, user1, user2 = crear_usuarios(db)

        crear_activos(db, user1, user2)
        
        crear_licencias(db) # <-- Nueva función llamada

        crear_tickets(db, tecnico1, tecnico2, user1, user2)

        print("\n✅ Base de datos poblada correctamente")
        print("\n🔑 Credenciales:")
        print("-----------------------------------")
        print("ADMIN    → admin@test.com / admin123")
        print("TÉCNICO  → ana@test.com / 123456")
        print("USUARIO  → maria@test.com / 123456")
        print("-----------------------------------\n")

    except Exception as e:
        print(f"\n❌ Error poblando BD: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_bd()