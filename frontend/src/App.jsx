import React, { useState, useEffect } from 'react';
import Login from "./views/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./views/Dashboard";
import Inventario from "./views/Inventario";
import Usuarios from "./views/Usuarios";
import MesaAyuda from "./views/MesaAyuda";

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
        const data = await res.json();
        setUser(data);
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
  if (!user) return <div className="h-screen bg-slate-950 flex items-center justify-center text-cyan-400 font-black tracking-widest animate-pulse">CONECTANDO A ZEN-IT GNN...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row font-sans overflow-hidden">
      <Sidebar 
        user={user} 
        setVista={setVista} 
        vistaActual={vista} 
        handleLogout={handleLogout} 
      />
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        {vista === 'dashboard' && <Dashboard user={user} />}
        {vista === 'inventario' && <Inventario token={token} />}
        {vista === 'tickets' && <MesaAyuda token={token} />}
        {vista === 'usuarios' && <Usuarios token={token} />}
      </main>
    </div>
  );
}

export default App;