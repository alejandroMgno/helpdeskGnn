from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.usuario import Usuario, RolUsuario, EstatusUsuario
from app.core.security import get_password_hash

def create_test_users():
    db = SessionLocal()
    try:
        users = [
            {
                "nombre": "Admin de Prueba",
                "email": "admin_test@gnn.com",
                "password": "Password123!",
                "rol": RolUsuario.Admin
            },
            {
                "nombre": "Técnico de Prueba",
                "email": "tecnico_test@gnn.com",
                "password": "Password123!",
                "rol": RolUsuario.Tecnico
            },
            {
                "nombre": "Usuario de Prueba",
                "email": "usuario_test@gnn.com",
                "password": "Password123!",
                "rol": RolUsuario.Usuario
            }
        ]

        for user_data in users:
            # Verificar si ya existe
            existing_user = db.query(Usuario).filter(Usuario.email == user_data["email"]).first()
            if existing_user:
                print(f"⚠️ El usuario {user_data['email']} ya existe. Saltando...")
                continue

            # Crear usuario
            new_user = Usuario(
                nombre_completo=user_data["nombre"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                rol=user_data["rol"],
                estatus=EstatusUsuario.Activo
            )
            db.add(new_user)
            print(f"✅ Usuario creado: {user_data['email']} (Rol: {user_data['rol']})")

        db.commit()
        print("\n🚀 Proceso de creación de usuarios finalizado.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
