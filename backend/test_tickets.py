
from app.db.database import SessionLocal
from app.models.ticket import Ticket
from app.models.usuario import Usuario, RolUsuario
from app.schemas.ticket import TicketResponse
import json

def test():
    db = SessionLocal()
    try:
        tickets = db.query(Ticket).all()
        print(f"Total tickets: {len(tickets)}")
        for t in tickets:
            try:
                tr = TicketResponse.model_validate(t)
                print(f"Validated Ticket ID: {t.id}, Title: {t.titulo}, Solicitante: {tr.solicitante.nombre_completo}")
            except Exception as e:
                print(f"Error validating Ticket {t.id}: {e}")
                # Check if solicitante exists
                solicitante = db.query(Usuario).get(t.solicitante_id)
                print(f"  Solicitante ID {t.solicitante_id} exists: {solicitante is not None}")
    finally:
        db.close()

if __name__ == "__main__":
    test()
