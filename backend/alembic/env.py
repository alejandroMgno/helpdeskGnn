from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- IMPORTACIONES DE TU PROYECTO ---
from app.core.config import settings
from app.db.base_class import Base

# Modelos (DEBEN estar importados aquí para que Alembic detecte las tablas)
from app.models.usuario import Usuario
from app.models.activo import Activo
from app.models.ticket import Ticket 

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- CONFIGURAR METADATA ---
# Esto es vital: le decimos a Alembic dónde buscar las estructuras de tus tablas
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # Forzamos la URL desde nuestra configuración (config.py)
    url = settings.SQLALCHEMY_DATABASE_URI
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # Obtenemos la sección del .ini y le SOBRESCRIBIMOS la URL correcta
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.SQLALCHEMY_DATABASE_URI

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()