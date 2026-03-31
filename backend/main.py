from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import engine
from app.db.base_class import Base

# Importar todos los routers
from app.api.routes import activos, auth, tickets, dashboard, usuarios

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME, 
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configurar CORS para que React pueda comunicarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar las rutas
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Autenticación"])
app.include_router(usuarios.router, prefix=f"{settings.API_V1_STR}/usuarios", tags=["Usuarios"])
app.include_router(activos.router, prefix=f"{settings.API_V1_STR}/activos", tags=["Activos ITAM"])
app.include_router(tickets.router, prefix=f"{settings.API_V1_STR}/tickets", tags=["Helpdesk"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])

@app.get("/")
def root():
    return {"message": "API Operativa - Zen-IT GNN"}