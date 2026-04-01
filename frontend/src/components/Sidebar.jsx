import React from 'react';

const Sidebar = ({ user, setVista, vistaActual, handleLogout }) => {
  const navItem = (id, label, icon) => (
    <button 
      onClick={() => setVista(id)}
      className={`w-full text-left p-3 rounded-xl transition-all font-bold text-[10px] tracking-widest uppercase mb-1 flex items-center gap-3 ${
        vistaActual === id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="text-sm">{icon}</span> {label}
    </button>
  );

  return (
    <aside className="w-full md:w-64 bg-white/5 backdrop-blur-xl border-b md:border-r border-white/10 p-6 flex flex-col h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-black tracking-tighter text-white">ZEN<span className="text-cyan-400">-</span>IT</h1>
        <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Gas Natural del Noroeste</p>
      </div>

      <nav className="flex-1">
        <p className="text-[7px] font-black text-slate-600 uppercase mb-4 tracking-widest ml-2">Operaciones</p>
        {navItem('dashboard', 'Dashboard', '📊')}
        {navItem('inventario', 'Inventario ITAM', '💻')}
        {navItem('tickets', 'Mesa de Ayuda', '🎫')}

        {user?.rol === 'admin' && (
          <div className="mt-8 border-t border-white/5 pt-6">
            <p className="text-[7px] font-black text-slate-600 uppercase mb-4 tracking-widest ml-2">Administración</p>
            {navItem('usuarios', 'Control de Usuarios', '👥')}
            {navItem('logs', 'Auditoría Global', '📜')}
          </div>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-xs">
            {user?.nombre?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black truncate w-24 uppercase">{user?.nombre}</p>
            <p className="text-[7px] text-cyan-400 font-bold uppercase">{user?.rol}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-red-500/50 hover:text-red-500 transition text-[9px] font-black">SALIR</button>
      </div>
    </aside>
  );
};

export default Sidebar;