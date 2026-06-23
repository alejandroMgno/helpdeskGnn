import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "zenit_desk.db")

def add_column_if_not_exists(cursor, table, column, type_def):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
        print(f"Columna '{column}' añadida a '{table}'.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print(f"La columna '{column}' ya existe en '{table}'.")
        else:
            print(f"Error al añadir '{column}' a '{table}': {e}")

def update_database():
    if not os.path.exists(db_path):
        print(f"Error: No se encontró la base de datos en {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # --- TABLAS DE CATÁLOGOS ---
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS marcas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                descripcion TEXT
            )
        """)
        print("Tabla 'marcas' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear marcas: {e}")

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS proveedores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                rfc TEXT,
                contacto_nombre TEXT,
                contacto_telefono TEXT,
                contacto_email TEXT,
                notas TEXT
            )
        """)
        print("Tabla 'proveedores' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear proveedores: {e}")

    # --- TABLAS ORGANIZACIONALES ---
    try:
        cursor.execute("CREATE TABLE IF NOT EXISTS zonas (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE NOT NULL)")
        print("Tabla 'zonas' verificada/creada.")
    except sqlite3.OperationalError as e: print(f"Error al crear zonas: {e}")

    try:
        cursor.execute("CREATE TABLE IF NOT EXISTS centros_costo (id INTEGER PRIMARY KEY AUTOINCREMENT, codigo TEXT UNIQUE NOT NULL, nombre TEXT NOT NULL)")
        print("Tabla 'centros_costo' verificada/creada.")
    except sqlite3.OperationalError as e: print(f"Error al crear centros_costo: {e}")

    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departamentos (
                id INTEGER PRIMARY KEY AUTOINCREMENT, 
                nombre TEXT NOT NULL, 
                zona_id INTEGER, 
                centro_costo_id INTEGER,
                FOREIGN KEY(zona_id) REFERENCES zonas(id),
                FOREIGN KEY(centro_costo_id) REFERENCES centros_costo(id)
            )
        """)
        print("Tabla 'departamentos' verificada/creada.")
    except sqlite3.OperationalError as e: print(f"Error al crear departamentos: {e}")

    try:
        cursor.execute("CREATE TABLE IF NOT EXISTS puestos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE NOT NULL)")
        print("Tabla 'puestos' verificada/creada.")
    except sqlite3.OperationalError as e: print(f"Error al crear puestos: {e}")

    # Usuarios
    add_column_if_not_exists(cursor, "usuarios", "avatar_url", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "especialidad", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "horario_entrada", "TEXT DEFAULT '09:00'")
    add_column_if_not_exists(cursor, "usuarios", "horario_salida", "TEXT DEFAULT '18:00'")
    add_column_if_not_exists(cursor, "usuarios", "is_tecnico_principal", "BOOLEAN DEFAULT 0")
    add_column_if_not_exists(cursor, "usuarios", "debe_cambiar_password", "BOOLEAN DEFAULT 0")
    
    # Nuevos campos de usuario
    add_column_if_not_exists(cursor, "usuarios", "empresa", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "no_empleado", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "fecha_ingreso", "DATETIME")
    add_column_if_not_exists(cursor, "usuarios", "subdepartamento", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "puesto", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "proyecto", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "ciudad", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "estado", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "razon_social", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "registro_patronal", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "razon_social_pagadora", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "no_banca", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "banco_pagador", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "correo_personal", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "celular_personal", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "celular_red", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "imss", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "rfc", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "curp", "TEXT")
    add_column_if_not_exists(cursor, "usuarios", "fecha_nacimiento", "DATETIME")
    add_column_if_not_exists(cursor, "usuarios", "edad", "INTEGER")
    add_column_if_not_exists(cursor, "usuarios", "sexo", "TEXT")

    # Mantenimientos (Bitácora)
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mantenimientos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                activo_id INTEGER,
                tecnico_id INTEGER,
                fecha DATETIME,
                tipo TEXT,
                descripcion TEXT,
                costo FLOAT,
                notas_internas TEXT,
                FOREIGN KEY(activo_id) REFERENCES activos(id),
                FOREIGN KEY(tecnico_id) REFERENCES usuarios(id)
            )
        """)
        print("Tabla 'mantenimientos' (Bitácora) verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear mantenimientos: {e}")

    # Tickets
    add_column_if_not_exists(cursor, "tickets", "satisfaccion_estrellas", "INTEGER")
    add_column_if_not_exists(cursor, "tickets", "satisfaccion_comentario", "TEXT")
    add_column_if_not_exists(cursor, "tickets", "fecha_actualizacion", "DATETIME")
    add_column_if_not_exists(cursor, "tickets", "reabierto", "BOOLEAN DEFAULT 0")
    add_column_if_not_exists(cursor, "tickets", "notificado_recordatorio_cierre", "BOOLEAN DEFAULT 0")
    add_column_if_not_exists(cursor, "tickets", "parent_ticket_id", "INTEGER")
    add_column_if_not_exists(cursor, "tickets", "is_escalation", "BOOLEAN DEFAULT 0")

    # SLA Config
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sla_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prioridad TEXT UNIQUE NOT NULL,
                horas INTEGER NOT NULL,
                descripcion TEXT
            )
        """)
        print("Tabla 'sla_configs' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear sla_configs: {e}")

    # Categorías
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categorias_activos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                icono TEXT DEFAULT 'pi pi-box'
            )
        """)
        print("Tabla 'categorias_activos' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear categorias_activos: {e}")

    # Activos
    add_column_if_not_exists(cursor, "activos", "modelo", "TEXT")
    add_column_if_not_exists(cursor, "activos", "marca_texto", "TEXT")
    add_column_if_not_exists(cursor, "activos", "imei", "TEXT")
    add_column_if_not_exists(cursor, "activos", "chip", "TEXT")
    add_column_if_not_exists(cursor, "activos", "serie", "TEXT")
    add_column_if_not_exists(cursor, "activos", "ram", "TEXT")
    add_column_if_not_exists(cursor, "activos", "cpu", "TEXT")
    add_column_if_not_exists(cursor, "activos", "pulgadas", "TEXT")
    add_column_if_not_exists(cursor, "activos", "almacenamiento", "TEXT")
    add_column_if_not_exists(cursor, "activos", "historial", "JSON DEFAULT '[]'")
    add_column_if_not_exists(cursor, "activos", "is_deleted", "BOOLEAN DEFAULT 0")
    add_column_if_not_exists(cursor, "activos", "factura_numero", "TEXT")
    add_column_if_not_exists(cursor, "activos", "marca_id", "INTEGER")
    add_column_if_not_exists(cursor, "activos", "proveedor_id", "INTEGER")
    add_column_if_not_exists(cursor, "activos", "fecha_ultimo_mantenimiento", "DATETIME")
    add_column_if_not_exists(cursor, "activos", "meses_mantenimiento", "INTEGER DEFAULT 6")
    add_column_if_not_exists(cursor, "activos", "fecha_proximo_mantenimiento", "DATETIME")
    add_column_if_not_exists(cursor, "activos", "motivo_baja", "TEXT")
    add_column_if_not_exists(cursor, "activos", "fecha_baja", "DATETIME")

    # Configuración SMTP - Asegurar tabla y campos
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS configuracion_smtp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                smtp_host TEXT DEFAULT 'smtp.gmail.com',
                smtp_port INTEGER DEFAULT 587,
                smtp_user TEXT DEFAULT '',
                smtp_password TEXT DEFAULT '',
                smtp_tls BOOLEAN DEFAULT 1,
                emails_from_email TEXT DEFAULT 'alertas@tuempresa.com',
                emails_from_name TEXT DEFAULT 'GNN SAM Alerts'
            )
        """)
        print("Tabla 'configuracion_smtp' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear configuracion_smtp: {e}")

    add_column_if_not_exists(cursor, "configuracion_smtp", "notificar_ticket_creado", "BOOLEAN DEFAULT 1")
    add_column_if_not_exists(cursor, "configuracion_smtp", "notificar_ticket_reasignado", "BOOLEAN DEFAULT 1")
    add_column_if_not_exists(cursor, "configuracion_smtp", "notificar_ticket_cerrado", "BOOLEAN DEFAULT 1")
    add_column_if_not_exists(cursor, "configuracion_smtp", "notificar_activo_asignado", "BOOLEAN DEFAULT 1")

    # Licencias (ROBUSTEZ)
    add_column_if_not_exists(cursor, "licencias", "proveedor_texto", "TEXT")
    add_column_if_not_exists(cursor, "licencias", "estatus", "TEXT DEFAULT 'Activa'")
    add_column_if_not_exists(cursor, "licencias", "documentos", "JSON DEFAULT '[]'")
    add_column_if_not_exists(cursor, "licencias", "is_deleted", "BOOLEAN DEFAULT 0")
    add_column_if_not_exists(cursor, "licencias", "proveedor_id", "INTEGER")
    add_column_if_not_exists(cursor, "licencias", "notified_vencimiento", "BOOLEAN DEFAULT 0")

    # Comentarios
    add_column_if_not_exists(cursor, "comentarios", "adjunto_url", "TEXT")
    add_column_if_not_exists(cursor, "comentarios", "adjunto_nombre", "TEXT")

    # --- TABLA DE AUDITORÍA ---
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS auditoria (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                accion TEXT,
                tabla_afectada TEXT,
                registro_id INTEGER,
                detalles_previos JSON,
                detalles_nuevos JSON,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_origen TEXT
            )
        """)
        print("Tabla 'auditoria' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear auditoria: {e}")

    # Crear tabla de asociación activo_licencia si no existe
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS activo_licencia (
                activo_id INTEGER,
                licencia_id INTEGER,
                PRIMARY KEY (activo_id, licencia_id),
                FOREIGN KEY (activo_id) REFERENCES activos (id),
                FOREIGN KEY (licencia_id) REFERENCES licencias (id)
            )
        """)
        print("Tabla de asociación 'activo_licencia' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear activo_licencia: {e}")

    # Crear tabla de asociación usuario_licencia si no existe
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usuario_licencia (
                usuario_id INTEGER,
                licencia_id INTEGER,
                PRIMARY KEY (usuario_id, licencia_id),
                FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
                FOREIGN KEY (licencia_id) REFERENCES licencias (id)
            )
        """)
        print("Tabla de asociación 'usuario_licencia' verificada/creada.")
    except sqlite3.OperationalError as e:
        print(f"Error al crear usuario_licencia: {e}")

    conn.commit()

    conn.close()

if __name__ == "__main__":
    update_database()
