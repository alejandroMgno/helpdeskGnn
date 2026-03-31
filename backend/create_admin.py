from app.db.database import SessionLocal
from app.models.usuario import Usuario
from app.core.security import get_password_hash

def init_db():
    db = SessionLocal()
    
    # Verificar si ya existe un admin
    admin = db.query(Usuario).filter(Usuario.email == "admin@gnn.com").first()
    
    if not admin:
        print("Creando usuario administrador principal...")
        user = Usuario(
            email="admin@gnn.com",
            nombre="Administrador GNN",
            hashed_password=get_password_hash("Zenit2026*"), # Contraseña segura encriptada
            rol="admin",
            zona="Corporativo",
            departamento="TI",
            status="activo"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"✅ Administrador creado exitosamente: {user.email}")
    else:
        print("El administrador ya existe.")
        
    db.close()

if __name__ == "__main__":
    init_db()