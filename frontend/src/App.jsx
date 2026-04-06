// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Asegúrate de tener instalado axios: npm install axios
import Login from "./views/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./views/Dashboard";
import Inventario from "./views/inventario";
import Licencias from "./views/licencias";
import Usuarios from "./views/usuarios";
import MesaAyuda from "./views/mesaAyuda";
import Conocimiento from "./views/conocimientos";
import Perfil from "./views/perfil";
import Reportes from "./views/reportes";

const API_URL = 'http://localhost:8000/api/v1';

function App() {
  const [token, setToken] = useState(localStorage.getItem('zenit_token'));
  const [user, setUser] = useState(null);
  const [vista, setVista] = useState('dashboard');
  const [cargando, setCargando] = useState(true);

  // --- CONEXIÓN REAL CON BACKEND ---
  useEffect(() => {
    const verificarSesion = async () => {
      if (!token) {
        setCargando(false);
        return;
      }
      try {
        // 1. Pedimos al backend el usuario actual usando el Token JWT
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Si el backend responde, guardamos al usuario real
        setUser(response.data);
      } catch (error) {
        console.error("Sesión inválida o expirada", error);
        localStorage.removeItem('zenit_token');
        setToken(null);
        setUser(null);
      } finally {
        setCargando(false);
      }
    };

    verificarSesion();
  }, [token]);

  // --- NOTA PARA EL BACKEND ---
  // Para que el código de arriba funcione, necesitas agregar este endpoint 
  // rápido en tu backend/app/api/routes/auth.py:
  /*
  @router.get("/me", response_model=UsuarioResponse)
  def get_me(current_user: Usuario = Depends(get_current_user)):
      return current_user
  */

  const handleLogout = () => {
    localStorage.removeItem('zenit_token');
    setToken(null);
    setUser(null);
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Login setToken={setToken} setUser={setUser} API_URL={API_URL} />;
  }

  const renderView = () => {
    switch (vista) {
      case 'dashboard': return <Dashboard user={user} token={token} />;
      case 'tickets': return <MesaAyuda user={user} token={token} />;
      case 'inventario': return <Inventario user={user} token={token} />;
      case 'licencias': return <Licencias user={user} token={token} />;
      case 'usuarios': return <Usuarios user={user} token={token} />;
      case 'conocimiento': return <Conocimiento user={user} token={token} />;
      case 'reportes': return <Reportes user={user} token={token} />;
      case 'perfil': return <Perfil user={user} token={token} />;
      default: return <Dashboard user={user} token={token} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-300">
      <Sidebar user={user} setUser={setUser} vistaActual={vista} setVista={setVista} handleLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-semibold tracking-wider">MÓDULO:</span>
            <span className="text-cyan-500 font-black tracking-widest uppercase text-sm">
              {vista === 'tickets' ? 'Mesa de Ayuda' : vista}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* 🚀 MODO PRUEBAS: Selector de Rol (Útil para debugear UI) */}
            <div className="flex items-center gap-2 mr-4 border-r border-slate-700 pr-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Simular Rol:</span>
              <select
                value={user.rol}
                onChange={(e) => {
                  setUser({ ...user, rol: e.target.value });
                  setVista('dashboard');
                }}
                className="bg-slate-800 text-cyan-400 text-xs font-bold px-2 py-1.5 rounded border border-slate-700 outline-none cursor-pointer"
              >
                <option value="Admin">👑 Admin</option>
                <option value="Tecnico">🔧 Técnico</option>
                <option value="Usuario">👤 Usuario Normal</option>
              </select>
            </div>

            <button className="text-slate-400 hover:text-white transition relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button onClick={() => setVista('perfil')} className="flex items-center gap-3 hover:bg-slate-800 p-1 pr-3 rounded-full transition border border-transparent hover:border-slate-700">
              <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.nombre_completo}`} alt="Avatar" className="w-8 h-8 rounded-full" />
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-white leading-tight">{user.nombre_completo}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{user.rol}</p>
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;