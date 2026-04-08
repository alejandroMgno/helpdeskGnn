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

function App() {
  const [token, setToken] = useState(localStorage.getItem('zenit_token'));
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
        localStorage.removeItem('zenit_token');
        setToken(null);
        setUser(null);
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('zenit_token');
    setToken(null);
    setUser(null);
    setVista('dashboard');
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Si no hay token o no hay usuario, mostramos el Login real
  if (!token || !user) {
    return <Login setToken={setToken} />;
  }

  // Renderizador de Vistas: AQUÍ ESTÁ LA MAGIA PARA QUE EL SIDEBAR FUNCIONE
  const renderView = () => {
    switch (vista) {
      case 'dashboard':
        return <Dashboard user={user} setVista={setVista} />;
      case 'tickets':
        return <MesaAyuda user={user} />;
      case 'conocimiento':
        return <Conocimiento user={user} token={token} />;
      case 'inventario':
        return <Inventario user={user} />;
      case 'licencias':
        return <Licencias user={user} />;
      case 'usuarios':
        return <Usuarios user={user} />;
      case 'reportes':
        return <Reportes user={user} />;
      default:
        return <Dashboard user={user} setVista={setVista} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-300">
      <Sidebar
        user={user}
        setUser={setUser}
        vistaActual={vista}
        setVista={setVista}
        handleLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-semibold tracking-wider">MÓDULO:</span>
            <span className="text-cyan-500 font-black tracking-widest uppercase text-sm">
              {vista}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-3 hover:bg-slate-800 p-1 pr-3 rounded-full transition border border-transparent hover:border-slate-700">
              <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">
                {user.nombre_completo.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-white leading-tight">{user.nombre_completo}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.rol}</p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Aquí se inyecta la vista que elijas en el Sidebar */}
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;