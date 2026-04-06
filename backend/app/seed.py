# backend/seed.py
from datetime import datetime, timedelta
from app.db.database import SessionLocal, engine
from app.db.base_class import Base
from app.models.usuario import Usuario, RolUsuario, EstatusUsuario, StatusTecnico
from app.models.ticket import Ticket, PrioridadTicket, EstatusTicket
from app.models.activo import Activo, TipoActivo, EstatusActivo
from app.core.security import get_password_hash

# Nos aseguramos que las tablas existan
Base.metadata.create_all(bind=engine)

def poblar_bd():
    db = SessionLocal()
    try:
        # 1. Limpieza de base de datos
        print("🧹 Limpiando base de datos...")
        db.query(Ticket).delete()
        db.query(Activo).delete()
        db.query(Usuario).delete()
        db.commit()

        print("🌱 Plantando semillas de datos...")

        # 2. Crear Técnicos y Administrador
        admin = Usuario(
            nombre_completo="Alejandro Rubio",
            email="admin@rubiofilms.com",
            hashed_password=get_password_hash("admin123"),
            rol=RolUsuario.Admin,
            zona="Corporativo",
            departamento="Dirección",
            centro_costo="CC-DIR-001"
        )
        
        tecnico_ana = Usuario(
            nombre_completo="Ana Gómez",
            email="agomez@rubiofilms.com",
            hashed_password=get_password_hash("tecnico123"),
            rol=RolUsuario.Tecnico,
            status_tecnico=StatusTecnico.Activo,
            zona="Corporativo",
            departamento="Sistemas"
        )
        
        tecnico_roberto = Usuario(
            nombre_completo="Roberto Torres",
            email="rtorres@rubiofilms.com",
            hashed_password=get_password_hash("tecnico123"),
            rol=RolUsuario.Tecnico,
            status_tecnico=StatusTecnico.Ocupado,
            zona="Zona Norte",
            departamento="Sistemas"
        )

        db.add_all([admin, tecnico_ana, tecnico_roberto])
        db.commit()
        db.refresh(tecnico_ana)
        db.refresh(tecnico_roberto)

        # 3. Crear Usuarios Normales (Asignando SLA)
        user_maria = Usuario(
            nombre_completo="María López",
            email="mlopez@rubiofilms.com",
            hashed_password=get_password_hash("user123"),
            rol=RolUsuario.Usuario,
            zona="Corporativo",
            departamento="Contabilidad",
            tecnico_base_id=tecnico_ana.id,
            tecnico_secundario_id=tecnico_roberto.id
        )
        
        user_juan = Usuario(
            nombre_completo="Juan Pérez",
            email="jperez@rubiofilms.com",
            hashed_password=get_password_hash("user123"),
            rol=RolUsuario.Usuario,
            zona="Zona Norte",
            departamento="Ventas",
            tecnico_base_id=tecnico_roberto.id,
            tecnico_secundario_id=tecnico_ana.id
        )

        db.add_all([user_maria, user_juan])
        db.commit()
        db.refresh(user_maria)
        db.refresh(user_juan)

        # 4. Crear Activos (Inventario)
        laptop1 = Activo(codigo="LAP-MAC-001", nombre="MacBook Pro M2", tipo=TipoActivo.Computo, estatus=EstatusActivo.Asignado, usuario_id=user_maria.id)
        monitor1 = Activo(codigo="MON-DELL-102", nombre="Monitor Dell 27 4K", tipo=TipoActivo.Periferico, estatus=EstatusActivo.Asignado, usuario_id=user_juan.id)
        router1 = Activo(codigo="RED-CISCO-01", nombre="Switch Piso 3", tipo=TipoActivo.Red, estatus=EstatusActivo.Disponible)

        db.add_all([laptop1, monitor1, router1])
        db.commit()

        # 5. Crear Tickets
        ticket1 = Ticket(
            titulo="No puedo abrir el sistema contable",
            descripcion="Al intentar abrir me marca error de conexión a la BD.",
            prioridad=PrioridadTicket.Alta,
            estatus=EstatusTicket.Abierto,
            solicitante_id=user_maria.id,
            tecnico_asignado_id=tecnico_ana.id,
            fecha_vencimiento_sla=datetime.utcnow() + timedelta(hours=8)
        )
        
        ticket2 = Ticket(
            titulo="Monitor no enciende",
            descripcion="El monitor huele a quemado y no da video.",
            prioridad=PrioridadTicket.Media,
            estatus=EstatusTicket.Abierto,
            solicitante_id=user_juan.id,
            tecnico_asignado_id=tecnico_roberto.id,
            fecha_vencimiento_sla=datetime.utcnow() + timedelta(hours=24)
        )
        
        ticket3 = Ticket( # 🚨 Este ticket ya se venció para que lo veas en rojo en el Dashboard
            titulo="Servidor ERP caído - URGENTE",
            descripcion="Nadie en la empresa puede facturar.",
            prioridad=PrioridadTicket.Critica,
            estatus=EstatusTicket.En_Progreso,
            solicitante_id=user_maria.id,
            tecnico_asignado_id=tecnico_ana.id,
            fecha_vencimiento_sla=datetime.utcnow() - timedelta(hours=1) 
        )

        db.add_all([ticket1, ticket2, ticket3])
        db.commit()

        print("✅ ¡Base de datos poblada con éxito!")
        print("\n🔑 CREDENCIALES DE PRUEBA LISTAS:")
        print("-------------------------------------------------")
        print("👑 ADMIN   -> Email: admin@rubiofilms.com   | Pass: admin123")
        print("🛠️ TÉCNICO -> Email: agomez@rubiofilms.com  | Pass: tecnico123")
        print("👤 USUARIO -> Email: mlopez@rubiofilms.com  | Pass: user123")
        print("-------------------------------------------------\n")

    except Exception as e:
        print(f"❌ Error poblando BD: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    poblar_bd()