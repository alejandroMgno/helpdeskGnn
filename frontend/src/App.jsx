import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Asegúrate de que esta URL apunte a la ruta base de tu nueva arquitectura
const API_URL = 'http://localhost:8000/api/v1';

function App() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [token, setToken] = useState(localStorage.getItem('zenit_token') || null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS DEL DASHBOARD ---
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [stats, setStats] = useState({ total_tickets: 0, grafica_prioridad: [], grafica_sla: [], auditoria_reciente: [] });

  // Estilos reutilizables (Glassmorphism)
  const glassPanel = "bg-white/10 backdrop-blur-md border border-white/10 shadow-lg rounded-2xl";
  const glassButton = "w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3";

  // --- LÓGICA DE LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    // FastAPI espera los datos en formato URL Encoded para OAuth2, NO en JSON
    const formData = new URLSearchParams();
    formData.append('username', loginForm.email);
    formData.append('password', loginForm.password);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('zenit_token', data.access_token);
        setToken(data.access_token);
      } else {
        const errData = await res.json();
        setLoginError(errData.detail || "Credenciales incorrectas");
      }
    } catch (error) {
      setLoginError("Error conectando con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenit_token');
    setToken(null);
  };

  // --- PANTALLA DE LOGIN ---
  if (!token) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Luces de fondo decorativas */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className={`${glassPanel} p-10 w-full max-w-md relative z-10 border-t border-t-cyan-400/30`}>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] mb-2">ZEN-IT</h1>
            <p className="text-slate-400 text-sm">Acceso al Sistema Empresarial GNN</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Correo Corporativo</label>
              <input 
                type="email" 
                required
                className="w-full bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                placeholder="admin@gnn.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Contraseña Segura</label>
              <input 
                type="password" 
                required
                className="w-full bg-slate-900/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
                {loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- PANTALLA DEL DASHBOARD (Protegida) ---
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white font-sans flex overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-widest text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">ZEN-IT</h1>
          <p className="text-sm text-slate-400 mt-1">GNN Admin Workspace</p>
        </div>
        
        <nav className="flex-1 space-y-3">
          <button className={`${glassButton} ${vistaActual === 'dashboard' ? 'bg-white/20 text-cyan-300' : 'text-slate-300'}`}>⊞ Dashboard</button>
          <button className={`${glassButton} text-slate-300 hover:bg-white/5`}>💻 Activos (ITAM)</button>
          <button className={`${glassButton} text-slate-300 hover:bg-white/5`}>🎫 Mesa de Ayuda</button>
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 text-slate-400 hover:text-red-400 transition-colors px-4 py-2 bg-white/5 rounded-xl hover:border-red-500/30 hover:bg-red-500/10 border border-transparent">
          <span>🚪</span> Cerrar Sesión
        </button>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 md:p-10 overflow-y-auto z-10 relative">
        <header className="flex justify-between items-center mb-10 relative z-10">
          <div>
            <h2 className="text-4xl font-semibold text-white drop-shadow-md">Panel