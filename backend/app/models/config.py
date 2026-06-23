from sqlalchemy import Column, Integer, String, Boolean
from app.db.base_class import Base

class ConfiguracionSMTP(Base):
    __tablename__ = "configuracion_smtp"
    id = Column(Integer, primary_key=True, index=True)
    smtp_host = Column(String(255), default="smtp.gmail.com")
    smtp_port = Column(Integer, default=587)
    smtp_user = Column(String(255), default="")
    smtp_password = Column(String(255), default="")
    smtp_tls = Column(Boolean, default=True)
    emails_from_email = Column(String(255), default="alertas@tuempresa.com")
    emails_from_name = Column(String(255), default="GNN SAM Alerts")

    # Flags de Notificaciones
    notificar_ticket_creado = Column(Boolean, default=True)
    notificar_ticket_reasignado = Column(Boolean, default=True)
    notificar_ticket_cerrado = Column(Boolean, default=True)
    notificar_activo_asignado = Column(Boolean, default=True)
