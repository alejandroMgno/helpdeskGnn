import sqlite3
import os

db_path = 'backend/zenit_desk.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

columns_to_add = [
    ('fecha_primera_respuesta', 'DATETIME'),
    ('tiempo_pausado_acumulado', 'INTEGER DEFAULT 0'),
    ('ultima_fecha_pausa', 'DATETIME')
]

for col_name, col_type in columns_to_add:
    try:
        cursor.execute(f"ALTER TABLE tickets ADD COLUMN {col_name} {col_type}")
        print(f"Column {col_name} added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"Column {col_name} already exists.")
        else:
            print(f"Error adding {col_name}: {e}")

# SQLite doesn't support ALTER TABLE DROP NOT NULL directly easily.
# But for nullable columns, we can try to re-create or just leave it if it's already there.
# Since fecha_vencimiento_sla was NOT NULL, and we want it NULLABLE, 
# in SQLite we usually have to recreate the table. 
# HOWEVER, for now, let's just see if adding the columns fixes the 'sincronización' error.

conn.commit()
conn.close()
