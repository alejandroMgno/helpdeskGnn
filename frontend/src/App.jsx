import React, { useState, useEffect } from 'react';
import Login from "./views/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./views/Dashboard";
import Inventario from "./views/Inventario";
import Usuarios from "./views/Usuarios";
import MesaAyuda from "./views/MesaAyuda";
// Estas dos vistas las crearemos en el próximo paso
import Conocimiento from "./views/Conocimiento"; 
import Perfil from "./views/Perfil"; 

const API_URL = 'http://localhost:8000/api/v1';

function App() {
  const [token, setToken] = useState(localStorage.getItem('zenit_token'));
  const [user, setUser] = useState(null);
  const [vista, setVista] = useState('dashboard');

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/usuarios/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUser(await res.json());
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenit_token');
    setToken(null);
    setUser(null);
    setVista('dashboard');
  };

  if (!token) return <Login setToken={setToken} />;
  if (!user) return <div className="h-screen bg-[#0B1120] flex items-center justify-center text-cyan-400 font-bold uppercase tracking-widest">Iniciando GNN Workspace...</div>;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-300 flex font-sans overflow-hidden">
      <Sidebar 
        user={user} 
        setUser={setUser}
        setVista={setVista} 
        vistaActual={vista} 
        handleLogout={handleLogout} 
        token={token}
      />
      
      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#0B1120]">
        {vista === 'dashboard' && <Dashboard user={user} token={token} />}
        {vista === 'inventario' && <Inventario token={token} user={user} />}
        {vista === 'tickets' && <MesaAyuda token={token} user={user} />}
        {vista === 'usuarios' && <Usuarios token={token} />}
        {/* Futuras pantallas ya ruteadas */}
        {vista === 'conocimiento' && <Conocimiento token={token} user={user} />}
        {vista === 'perfil' && <Perfil token={token} user={user} setUser={setUser} />}
      </main>
    </div>
  );
}

export default App;