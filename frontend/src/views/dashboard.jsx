import React from 'react';

const Dashboard = ({ user, token }) => {
  return (
    <div className="animate-in fade-in duration-700 space-y-6 text-slate-200">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Dashboard Central</h1>
        <p className="text-cyan-500 text-xs font-bold uppercase tracking-widest mt-1">
          {user?.rol === 'admin' ? 'Visión Global de TI GNN' : `Panel de Trabajo - ${user?.nombre}`}
        </p>
      </header>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tickets Abiertos</p>
          <p className="text-4xl font-black text-white mt-2">24</p>
          <p className="text-xs text-red-400 mt-2 font-bold uppercase">↑ 4 Críticos (SLA 2h)</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipos Activos</p>
          <p className="text-4xl font-black text-white mt-2">1,204</p>
          <p className="text-xs text-cyan-500 mt-2 font-bold uppercase">Repartidos en 4 zonas</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mantenimientos</p>
          <p className="text-4xl font-black text-orange-400 mt-2">12</p>
          <p className="text-xs text-slate-400 mt-2 font-bold uppercase">3 Vencen esta semana</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Efectividad SLA</p>
          <p className="text-4xl font-black text-green-500 mt-2">94%</p>
          <p className="text-xs text-slate-400 mt-2 font-bold uppercase">Resueltos a tiempo</p>
        </div>
      </div>

      {/* PANELES DE CONTROL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL DE MANTENIMIENTO PROACTIVO */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-sm font-black uppercase text-white mb-4 tracking-widest border-b border-slate-700 pb-3">Próximos Mantenimientos (Auto-generados)</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white uppercase">LAP-042 (Lenovo ThinkPad)</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Asignado: Norma López (Noroeste)</p>
              </div>
              <button className="bg-slate-800 text-orange-400 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Ver Auto-Ticket</button>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white uppercase">PC-110 (Dell Optiplex)</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1 font-bold">Asignado: Ventas (Sur)</p>
              </div>
              <button className="bg-slate-800 text-orange-400 border border-slate-700 hover:bg-slate-700 px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-colors">Generar Ticket</button>
            </div>
          </div>
        </div>

        {/* PANEL DE TICKETS Y SLA */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-sm font-black uppercase text-white mb-4 tracking-widest border-b border-slate-700 pb-3">Cola de Tickets Urgentes</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded border border-slate-800 border-l-4 border-l-red-500">
              <div className="flex-1">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Crítica (SLA) - Vence en 1h 20m</p>
                <p className="text-xs font-bold text-white mt-1 uppercase">Servidor Caído en Sucursal Norte</p>
              </div>
              <button className="text-cyan-500 hover:text-cyan-400 font-black text-[10px] uppercase tracking-widest">Reasignar</button>
            </div>
            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded border border-slate-800 border-l-4 border-l-orange-500">
              <div className="flex-1">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Alta (SLA) - Vence en 6h</p>
                <p className="text-xs font-bold text-white mt-1 uppercase">Impresora Dirección atascada</p>
              </div>
              <button className="text-cyan-500 hover:text-cyan-400 font-black text-[10px] uppercase tracking-widest">Asignar a Mí</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;