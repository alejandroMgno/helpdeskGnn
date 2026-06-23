# backend/app/services/email_service.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def enviar_email(email_to: str, subject: str, body_html: str):
    """Función genérica para enviar correos electrónicos usando config de DB."""
    from app.db.database import SessionLocal
    from app.models.config import ConfiguracionSMTP
    
    db = SessionLocal()
    config = db.query(ConfiguracionSMTP).first()
    db.close()

    smtp_host = config.smtp_host if config and config.smtp_host else settings.SMTP_HOST
    smtp_port = config.smtp_port if config and config.smtp_port else settings.SMTP_PORT
    smtp_user = config.smtp_user if config and config.smtp_user else settings.SMTP_USER
    smtp_password = config.smtp_password if config and config.smtp_password else settings.SMTP_PASSWORD
    smtp_tls = config.smtp_tls if config is not None else settings.SMTP_TLS
    from_email = config.emails_from_email if config and config.emails_from_email else settings.EMAILS_FROM_EMAIL
    from_name = config.emails_from_name if config and config.emails_from_name else settings.EMAILS_FROM_NAME

    if not smtp_user or not smtp_password:
        print(f"DEBUG: Email para {email_to} no enviado (SMTP no configurado).")
        print(f"Subject: {subject}")
        return False

    message = MIMEMultipart()
    message["From"] = f"{from_name} <{from_email}>"
    message["To"] = email_to
    message["Subject"] = subject

    message.attach(MIMEText(body_html, "html"))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        if smtp_tls:
            server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(from_email, email_to, message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Error enviando email: {str(e)}")
        return False

def notificar_vencimiento_licencia(email_to: str, licencia_nombre: str, fecha_vencimiento: str, dias_restantes: int):
    subject = f"⚠️ Alerta SAM: Licencia '{licencia_nombre}' vence pronto"
    
    color_alerta = "#eab308" if dias_restantes > 7 else "#ef4444"
    
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: {color_alerta};">Aviso de Renovación</h2>
                <p>Estimado equipo de TI,</p>
                <p>Este es un recordatorio automático del sistema <strong>GNN SAM</strong>.</p>
                <div style="background-color: #f8fafc; border-left: 4px solid {color_alerta}; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Software:</strong> {licencia_nombre}</p>
                    <p style="margin: 5px 0 0 0;"><strong>Vencimiento:</strong> {fecha_vencimiento}</p>
                    <p style="margin: 5px 0 0 0; font-weight: bold;">Faltan: {dias_restantes} días</p>
                </div>
                <p>Por favor, revise el portal de gestión para proceder con la orden de compra o renovación.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #94a3b8;">Este es un correo automático, por favor no responda.</p>
            </div>
        </body>
    </html>
    """
    return enviar_email(email_to, subject, html)

def notificar_ticket_nuevo(email_to: str, ticket_id: int, titulo: str, solicitante: str, tecnico: str = "Sin asignar"):
    """Envia correo al crear un ticket."""
    from app.db.database import SessionLocal
    from app.models.config import ConfiguracionSMTP
    db = SessionLocal()
    config = db.query(ConfiguracionSMTP).first()
    db.close()
    if config and not config.notificar_ticket_creado: return

    subject = f"🆕 Nuevo Ticket #{ticket_id}: {titulo}"
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0891b2;">Nuevo Ticket Registrado</h2>
                <p>Se ha generado un nuevo ticket de soporte en la plataforma.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Ticket ID:</strong> #{ticket_id}</p>
                    <p><strong>Asunto:</strong> {titulo}</p>
                    <p><strong>Solicitante:</strong> {solicitante}</p>
                    <p><strong>Técnico Asignado:</strong> {tecnico}</p>
                </div>
                <p>Puede hacer seguimiento en el portal de Mesa de Ayuda.</p>
            </div>
        </body>
    </html>
    """
    enviar_email(email_to, subject, html)

def notificar_ticket_reasignado(email_to: str, ticket_id: int, titulo: str, nuevo_tecnico: str):
    """Envia correo al reasignar un ticket."""
    from app.db.database import SessionLocal
    from app.models.config import ConfiguracionSMTP
    db = SessionLocal()
    config = db.query(ConfiguracionSMTP).first()
    db.close()
    if config and not config.notificar_ticket_reasignado: return

    subject = f"🔄 Ticket #{ticket_id} Reasignado"
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0891b2;">Actualización de Ticket</h2>
                <p>El ticket #{ticket_id} ha sido reasignado a un nuevo especialista.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Asunto:</strong> {titulo}</p>
                    <p><strong>Nuevo Técnico:</strong> {nuevo_tecnico}</p>
                </div>
            </div>
        </body>
    </html>
    """
    enviar_email(email_to, subject, html)

def notificar_ticket_cerrado(email_to: str, ticket_id: int, titulo: str):
    """Envia correo al cerrar un ticket."""
    from app.db.database import SessionLocal
    from app.models.config import ConfiguracionSMTP
    db = SessionLocal()
    config = db.query(ConfiguracionSMTP).first()
    db.close()
    if config and not config.notificar_ticket_cerrado: return

    subject = f"✅ Ticket #{ticket_id} Cerrado / Resuelto"
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #10b981;">Ticket Finalizado</h2>
                <p>El ticket #{ticket_id} ha sido marcado como resuelto/cerrado.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Asunto:</strong> {titulo}</p>
                </div>
                <p>Por favor, ingrese al portal para calificar la atención recibida.</p>
            </div>
        </body>
    </html>
    """
    enviar_email(email_to, subject, html)

def notificar_recuperacion_password(email_to: str, password_temporal: str):
    """Envia correo con contraseña temporal."""
    subject = "🔑 Recuperación de Contraseña - GNN SAM"
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0891b2;">Recuperación de Contraseña</h2>
                <p>Se ha generado una contraseña temporal para su cuenta.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <p style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">{password_temporal}</p>
                </div>
                <p><strong>IMPORTANTE:</strong> Por seguridad, se le pedirá cambiar esta contraseña al iniciar sesión.</p>
                <p>Si usted no solicitó este cambio, por favor contacte a soporte de inmediato.</p>
            </div>
        </body>
    </html>
    """
    return enviar_email(email_to, subject, html)

def notificar_activo_asignado(email_to: str, activo_nombre: str, codigo: str, evento: str):
    """Envia correo al asignar/desvincular un activo."""
    from app.db.database import SessionLocal
    from app.models.config import ConfiguracionSMTP
    db = SessionLocal()
    config = db.query(ConfiguracionSMTP).first()
    db.close()
    if config and not config.notificar_activo_asignado: return

    es_alta = "Asignado" in evento
    subject = f"{'💻' if es_alta else '📤'} {evento}: {activo_nombre}"
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0891b2;">Movimiento de Inventario</h2>
                <p>Se ha registrado un cambio en la asignación de equipo a su nombre.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Evento:</strong> {evento}</p>
                    <p><strong>Equipo:</strong> {activo_nombre}</p>
                    <p><strong>Código:</strong> {codigo}</p>
                </div>
                <p>{'Por favor, verifique la recepción física del equipo.' if es_alta else 'Se ha formalizado la devolución/desvinculación del equipo.'}</p>
            </div>
        </body>
    </html>
    """
    enviar_email(email_to, subject, html)

def notificar_recordatorio_cierre_ticket(email_to: str, ticket_id: int, titulo: str):
    """Envia correo recordatorio al usuario para cerrar un ticket resuelto."""
    subject = f"🔔 Recordatorio: Por favor cierre su Ticket #{ticket_id}"
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #0891b2;">Recordatorio de Cierre</h2>
                <p>Su ticket #{ticket_id} ha sido marcado como <strong>Resuelto</strong> por el equipo técnico.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Asunto:</strong> {titulo}</p>
                </div>
                <p>Si la solución es satisfactoria, por favor ingrese al portal y marque el ticket como <strong>Cerrado</strong>.</p>
                <p style="color: #64748b; font-size: 14px;">Nota: Si no se realiza ninguna acción, el ticket se cerrará automáticamente en las próximas 12 horas con la calificación más alta.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 12px; color: #94a3b8;">Este es un correo automático, por favor no responda.</p>
            </div>
        </body>
    </html>
    """
    return enviar_email(email_to, subject, html)

def notificar_mantenimiento_realizado(email_to: str, activo_nombre: str, tipo_servicio: str, fecha_ejecucion: str, proximo_mantenimiento: str, descripcion_tecnica: str):
    """Envia correo con los detalles del mantenimiento realizado."""
    subject = f"🛠️ Mantenimiento Realizado: {activo_nombre}"
    html = f"""
    <html>
        <body style="font-family: sans-serif; color: #334155;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                <h2 style="color: #4f46e5;">Mantenimiento Registrado</h2>
                <p>Se ha registrado un mantenimiento en el sistema para el equipo: <strong>{activo_nombre}</strong>.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Tipo de Servicio:</strong> {tipo_servicio}</p>
                    <p><strong>Fecha de Ejecución:</strong> {fecha_ejecucion}</p>
                    <p><strong>Próximo Mantenimiento:</strong> {proximo_mantenimiento}</p>
                    <p><strong>Descripción Técnica:</strong><br/>{descripcion_tecnica}</p>
                </div>
            </div>
        </body>
    </html>
    """
    return enviar_email(email_to, subject, html)
