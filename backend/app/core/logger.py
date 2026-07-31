import structlog
import logging
import sys
import uuid
from fastapi import Request

def setup_logging():
    # Configuración de los procesadores para JSON estructurado
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=shared_processors + [
            structlog.processors.JSONRenderer()
        ],
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
        wrapper_class=structlog.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configurar el logger estándar para capturar logs de librerías externas
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

# Logger instanciado
logger = structlog.get_logger()

# Middleware para rastreo de peticiones (Request ID)
async def request_id_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(request_id=request_id)
    
    logger.info("peticion_http", method=request.method, path=request.url.path)
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response
