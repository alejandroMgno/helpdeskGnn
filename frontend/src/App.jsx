// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import clienteAxios from './api/axios'; // Importamos el puente
import Login from "./views/login";
import Sidebar from "./components/Sidebar";

// IMPORTAMOS TODAS TUS VISTAS REALES
import Dashboard from "./views/dashboard";
import Conocimiento from "./views/conocimientos";
import MesaAyuda from "./views/mesaAyuda";
import Inventario from "./views/inventario";
import Licencias from "./views/licencias";
import Usuarios from "./views/usuarios";
import Reportes from "./views/reportes";
import Perfil from "./views/perfil";
import Configuracion from "./views/configuracion";
import CambiarPassword from "./views/cambiarPassword";

function App() {
  const [token, setToken] = useState(localStorage.getItem('gnn_token'));
  const [user, setUser] = useState(null);
  const [vista, setVista] = useState('dashboard');
  const [cargando, setCargando] = useState(true);

  // EFECTO: Verifica la sesión real en la Base de Datos
  useEffect(() => {
    const verificarSesion = async () => {
      if (!token) {
        setCargando(false);
        return;
      }
      try {
        // Le preguntamos al backend los datos del usuario logueado
        const res = await clienteAxios.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        console.error("Sesión inválida o expirada");
        localStorage.removeItem('gnn_token');
        setToken(null);
        setUser(null);
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, [token]);

  // EFECTO: WebSocket para Notificaciones Globales
  useEffect(() => {
    if (!user || !token) return;

    // Solicitar permiso para notificaciones del navegador
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    let timeoutId;
    const connectNotificationWS = () => {
      const wsUrl = `ws://${window.location.hostname}:8000/api/v1/tickets/ws/notifications/${user.id}`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => console.log("App: Notification WS Conectado ✅");

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'notification') {
          console.log("Nueva notificación:", msg);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(msg.title, {
              body: msg.body,
              icon: "/favicon.svg"
            });
          }
        }
      };

      socket.onclose = () => {
        console.log("App: Notification WS Desconectado. Reintentando en 3s...");
        timeoutId = setTimeout(connectNotificationWS, 3000);
      };

      socket.onerror = (error) => console.error("WS Notification Error:", error);
    };

    connectNotificationWS();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user?.id, token]);

  const handleLogout = async () => {
    try {
      await clienteAxios.post('/auth/logout');
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    }
    localStorage.removeItem('gnn_token');
    setToken(null);
    setUser(null);
    setVista('dashboard');
  };

  // PANTALLA DE CARGA (Estilo Claro / Corporativo)
  if (cargando) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no hay token o no hay usuario, mostramos el Login real
  if (!token || !user) {
    return <Login setToken={setToken} />;
  }

  // Si debe cambiar password, lo forzamos antes de mostrar el resto
  if (user.debe_cambiar_password) {
    return <CambiarPassword setUser={setUser} />;
  }

  // Renderizador de Vistas
  const renderView = () => {
    switch (vista) {
      case 'dashboard':
        return <Dashboard user={user} setVista={setVista} />;
      case 'tickets':
        return <MesaAyuda user={user} />;
      case 'conocimiento':
        return <Conocimiento user={user} token={token} />;
      case 'inventario':
        return <Inventario user={user} token={token} />;
      case 'licencias':
        return <Licencias user={user} token={token} />;
      case 'usuarios':
        return <Usuarios user={user} token={token} />;
      case 'reportes':
        return <Reportes user={user} />;
      case 'perfil':
        return <Perfil user={user} token={token} setUser={setUser} />;
      case 'configuracion':
        return <Configuracion user={user} />;
      default:
        return <Dashboard user={user} setVista={setVista} />;
    }
  };

  // Función para obtener iniciales del usuario
  const getIniciales = (nombre) => nombre ? nombre.substring(0, 2).toUpperCase() : 'U';

  // Formatear el nombre de la vista para el Header (ej. "mesaAyuda" -> "Mesa Ayuda")
  const nombreVistaMapeado = vista.replace(/([A-Z])/g, ' $1').trim();
  const tituloHeader = nombreVistaMapeado.charAt(0).toUpperCase() + nombreVistaMapeado.slice(1);

  return (
    // CONTENEDOR PRINCIPAL: Fondo gris claro (#f4f5f7) estilo iTop
    <div className="flex h-screen bg-[#f4f5f7] overflow-hidden font-sans text-[#333333]">

      {/* Sidebar */}
      <Sidebar
        user={user}
        setUser={setUser}
        vistaActual={vista}
        setVista={setVista}
        handleLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* TOPBAR BLANCA ESTILO iTOP */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">

          {/* Breadcrumb / Título Izquierdo */}
          <div className="flex items-center gap-2 text-slate-500">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            <span className="text-sm font-medium">Welcome / <span className="font-semibold text-slate-700">{tituloHeader}</span></span>
          </div>

          {/* Menú de Usuario Derecho */}
          <div className="flex items-center gap-4">
            {/* <-- 3. AGREGAMOS EL onClick AL BOTÓN DEL USUARIO --> */}
            <button
              onClick={() => setVista('perfil')}
              className="flex items-center gap-2 hover:bg-slate-50 p-1.5 pr-2 rounded-md transition border border-transparent group"
            >
              <span className="text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors">
                Welcome, {user.nombre_completo.split(' ')[0]}
              </span>
              <div className="w-7 h-7 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-300">
                {/* Mostramos la foto real si existe, si no, las iniciales */}
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  getIniciales(user.nombre_completo)
                )}
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
          </div>
        </header>

        {/* CONTENEDOR DE LA VISTA (Área de trabajo) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar-light">
          <div className="max-w-[1400px] mx-auto h-full">
            {/* Aquí se inyecta la vista que elijas en el Sidebar */}
            {renderView()}
          </div>
        </div>
      </main>

      {/* ESTILOS GLOBALES DE SCROLLBAR (Modo Claro) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-light::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}

export default App;