from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.usuario import Usuario

def verify_all_users():
    db = SessionLocal()
    try:
        users = db.query(Usuario).filter(Usuario.is_email_verified == False).all()
        
        if not users:
            print("✅ No hay usuarios pendientes de verificación.")
            return

        print(f"🔄 Encontrados {len(users)} usuarios pendientes de verificación.")
        for user in users:
            user.is_email_verified = True
            user.email_verification_token = None
            print(f"🔓 Usuario verificado: {user.email}")

        db.commit()
        print("\n🚀 Todos los usuarios han sido verificados exitosamente.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    verify_all_users()
