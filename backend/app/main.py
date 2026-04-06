# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine
from app.db.base_class import Base

# Importamos TODAS las rutas finales
from app.api.routes import auth, usuarios, tickets, activos, dashboard

# Crea todas las tablas en base de datos (¡incluyendo Activos y Tickets!)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

origins = [
    "http://localhost:5173", 
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inyección de todos los módulos del sistema
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Autenticación"])
app.include_router(usuarios.router, prefix=f"{settings.API_V1_STR}/usuarios", tags=["Usuarios"])
app.include_router(tickets.router, prefix=f"{settings.API_V1_STR}/tickets", tags=["Tickets (SLA)"])
app.include_router(activos.router, prefix=f"{settings.API_V1_STR}/activos", tags=["Inventario"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Métricas"])

@app.get("/")
def root():
    return {"mensaje": "API de Zenit Service Desk operando al 100% 🚀"}