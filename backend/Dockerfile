# Usar imagen base ligera de Python
FROM python:3.11-slim

# Evitar que Python genere archivos .pyc
ENV PYTHONDONTWRITEBYTECODE=1
# Evitar que Python bufferice el stdout/stderr
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema (necesarias para psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código fuente
COPY . .

# Crear y dar permisos al script de entrada
RUN echo '#!/bin/sh\n\
echo "Running migrations..."\n\
alembic upgrade head\n\
echo "Starting application..."\n\
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000' > entrypoint.sh && \
    chmod +x entrypoint.sh

# Exponer el puerto
EXPOSE 8000

# Usar el script de entrada
ENTRYPOINT ["./entrypoint.sh"]
