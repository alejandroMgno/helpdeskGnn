from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # ticket_id -> list of websockets (Para el chat abierto)
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # user_id -> list of websockets (Para notificaciones globales)
        self.user_connections: Dict[int, List[WebSocket]] = {}
        # Lista global para actualizaciones del dashboard (Admin/Tecnico)
        self.global_connections: List[WebSocket] = []

    async def _safe_accept(self, websocket: WebSocket):
        """Acepta la conexión solo si no ha sido aceptada previamente."""
        try:
            # Estado 'connect' significa que aún no se ha aceptado
            if websocket.client_state.value == 0: 
                await websocket.accept()
        except Exception:
            pass

    # --- CHAT POR TICKET ---
    async def connect(self, websocket: WebSocket, ticket_id: int):
        await self._safe_accept(websocket)
        if ticket_id not in self.active_connections:
            self.active_connections[ticket_id] = []
        self.active_connections[ticket_id].append(websocket)

    def disconnect(self, websocket: WebSocket, ticket_id: int):
        if ticket_id in self.active_connections:
            if websocket in self.active_connections[ticket_id]:
                self.active_connections[ticket_id].remove(websocket)
            if not self.active_connections[ticket_id]:
                del self.active_connections[ticket_id]

    async def broadcast_to_ticket(self, ticket_id: int, message: dict):
        if ticket_id in self.active_connections:
            for connection in self.active_connections[ticket_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    # --- NOTIFICACIONES POR USUARIO ---
    async def connect_user(self, websocket: WebSocket, user_id: int):
        await self._safe_accept(websocket)
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect_user(self, websocket: WebSocket, user_id: int):
        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def notify_user(self, user_id: int, message: dict):
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    # --- BROADCAST GLOBAL (Dashboard/SLA) ---
    async def connect_global(self, websocket: WebSocket):
        await self._safe_accept(websocket)
        self.global_connections.append(websocket)

    def disconnect_global(self, websocket: WebSocket):
        if websocket in self.global_connections:
            self.global_connections.remove(websocket)

    async def broadcast_global(self, message: dict):
        # Notificar a las conexiones del dashboard
        stale_globals = []
        for connection in self.global_connections:
            try:
                await connection.send_json(message)
            except Exception:
                stale_globals.append(connection)
        
        for stale in stale_globals:
            self.disconnect_global(stale)
        
        # Notificar a todas las conexiones de usuarios (Mesa de Ayuda, etc.)
        stale_users = []
        for user_id in list(self.user_connections.keys()):
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    stale_users.append((user_id, connection))
        
        for user_id, connection in stale_users:
            self.disconnect_user(connection, user_id)
        
        print(f"DEBUG WS: Broadcast Global enviado: {message.get('type')}")

manager = ConnectionManager()
