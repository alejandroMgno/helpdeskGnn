from pydantic import BaseModel
from typing import Optional

class SMTPConfigBase(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    smtp_tls: bool
    emails_from_email: str
    emails_from_name: str
    notificar_ticket_creado: bool = True
    notificar_ticket_reasignado: bool = True
    notificar_ticket_cerrado: bool = True
    notificar_activo_asignado: bool = True

class SMTPConfigUpdate(SMTPConfigBase):
    pass

class SMTPConfigResponse(SMTPConfigBase):
    id: int
    class Config:
        from_attributes = True
