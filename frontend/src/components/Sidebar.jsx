import React, { useState } from 'react';

const Sidebar = ({ user, setUser, setVista, vistaActual, handleLogout, token }) => {
  const [cambiandoStatus, setCambiandoStatus] = useState(false);

  const cambiarStatus = async (nuevoStatus) => {
    setCambiandoStatus(true);
    setUser({...user, status_tecnico: nuevoStatus});
    setCambiandoStatus(false);
  };

  const navItem = (id, label, icon) => (
    <button 
      onClick={() => setVista(id)}
      className={`w-full text-left px-5 py-3 rounded transition-colors font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-4 ${
        vistaActual === id 
          ? 'bg-cyan-600 text-white' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <span className="text-lg">{icon}</span> {label}
    </button>
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shadow-xl">
      <div className="p-6 border-b border-slate-800 bg-slate-900">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">GNN<span className="text-cyan-500">.IT</span></h1>
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Service Workspace</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="text-[10px] font-black text-slate-600 uppercase mb-3 px-2 tracking-widest">Mi Espacio</p>
          {navItem('dashboard', 'Dashboard', '📊')}
          {navItem('tickets', 'Mesa de Ayuda', '🎫')}
          {navItem('conocimiento', 'Conocimiento', '📚')}
        </div>

        {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
          <div>
            <p className="text-[10px] font-black text-slate-600 uppercase mb-3 px-2 tracking-widest mt-4">Operaciones TI</p>
            {navItem('inventario', 'Gestión Activos', '💻')}
            {user?.rol === 'admin' && navItem('usuarios', 'Admin. Usuarios', '👥')}
          </div>
        )}
      </div>

      <div className="p-5 border-t border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3 mb-5 cursor-pointer hover:bg-slate-900 p-2 rounded transition-colors" onClick={() => setVista('perfil')}>
          <div className="w-10 h-10 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-cyan-500">
            {user?.nombre?.charAt(0)}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[11px] font-black text-white truncate uppercase">{user?.nombre}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{user?.departamento}</p>
          </div>
        </div>

        {(user?.rol === 'admin' || user?.rol === 'tecnico') && (
          <div className="mb-4">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Mi Estatus (SLA):</p>
            <select 
              className="w-full bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 rounded p-2.5 outline-none focus:border-cyan-500 uppercase transition-colors"
              value={user?.status_tecnico || 'activo'}
              onChange={(e) => cambiarStatus(e.target.value)}
              disabled={cambiandoStatus}
            >
              <option value="activo">🟢 Disponible</option>
              <option value="ocupado">🔴 Ocupado</option>
              <option value="comiendo">🟠 Comiendo</option>
              <option value="fuera">⚪ Fuera de Oficina</option>
              <option value="vacaciones">🏖️ En Vacaciones</option>
            </select>
          </div>
        )}

        <button onClick={handleLogout} className="w-full text-center bg-slate-900 hover:bg-red-900/30 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-900 py-2.5 rounded transition-all text-[10px] font-black uppercase tracking-widest">
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;