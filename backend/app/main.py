# backend/app/main.py
import os # NUEVO: Necesario para crear carpetas
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles # NUEVO: Necesario para servir los PDFs
from app.core.config import settings
from app.db.database import engine
from app.db.base_class import Base

# 1. IMPORTANTE: Importamos los modelos ANTES de create_all para que SQLAlchemy los reconozca.
from app.models import usuario, ticket, activo, auditoria, catalogos 

# Importamos TODAS las rutas finales
from app.api.routes import auth, usuarios, tickets, activos, dashboard, articulos, licencias, catalogos, config

# 2. Crea todas las tablas en base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# NUEVO: Asegurar que el directorio de uploads exista para evitar crasheos al subir el primer PDF
os.makedirs("uploads/facturas", exist_ok=True)

# NUEVO: Montar el directorio para que el Frontend (React) pueda acceder a las facturas PDF vía URL
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = [
    "http://localhost:5173", # Frontend Vite/React
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Unificamos el uso de settings.API_V1_STR para mantener consistencia en todas las rutas
# Registrar los Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Autenticación"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(usuarios.router, prefix="/api/v1/usuarios", tags=["Usuarios"])
app.include_router(tickets.router, prefix="/api/v1/tickets", tags=["Tickets"])
app.include_router(activos.router, prefix="/api/v1/activos", tags=["Activos"])
app.include_router(articulos.router, prefix="/api/v1/articulos", tags=["Base de Conocimientos"])
app.include_router(licencias.router, prefix="/api/v1/licencias", tags=["licencias"])
app.include_router(catalogos.router, prefix="/api/v1/catalogos", tags=["Catálogos"])
app.include_router(config.router, prefix="/api/v1/config", tags=["Configuración General"])

@app.get("/")
def root():
    return {"mensaje": "API de Zenit Service Desk operando al 100% 🚀"}

# --- NUEVO: Hilo en segundo plano para mantenimiento automático de tickets ---
import threading
import time
from app.db.database import SessionLocal
from app.services.maintenance_engine import cerrar_tickets_automaticos, iniciar_sla_automatico

def run_periodic_maintenance():
    # Loop continuo cada 30 minutos
    while True:
        try:
            db = SessionLocal()
            try:
                cerrar_tickets_automaticos(db)
                iniciar_sla_automatico(db)
            finally:
                db.close()
        except Exception as e:
            print(f"Error en mantenimiento periódico de tickets: {str(e)}")
        time.sleep(1800)  # 30 minutos

@app.on_event("startup")
def startup_event():
    # Inicia el hilo en segundo plano
    threading.Thread(target=run_periodic_maintenance, daemon=True).start()