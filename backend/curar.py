import sqlite3
import os

db_path = "zenit_desk.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    # Reseteamos a todos los usuarios a "Activo" para destrabar el Error 500
    cursor.execute("UPDATE usuarios SET status_tecnico = 'Activo'")
    conn.commit()
    conn.close()
    print("✅ Base de datos curada con éxito. Ya puedes iniciar sesión.")
else:
    print("❌ No se encontró zenit_desk.db. Asegúrate de estar en la carpeta backend.")