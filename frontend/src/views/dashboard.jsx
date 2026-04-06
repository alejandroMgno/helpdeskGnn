// frontend/src/views/Dashboard.jsx
import React from 'react';

const Dashboard = ({ user }) => {
  const primerNombre = user?.nombre_completo ? user.nombre_completo.split(' ')[0] : 'Usuario';

  // ==========================================
  // 1. VISTA DE ADMINISTRADOR (Torre de Control Total)
  // ==========================================
  if (user?.rol === 'Admin') {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Torre de Control <span className="text-cyan-500">Global</span></h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Supervisión total de la infraestructura y SLAs</p>
          </div>
          <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest transition shadow-lg shadow-cyan-900/20">
            Generar Reporte PDF
          </button>
        </div>

        {/* KPIs Globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tickets Totales</p>
            <h3 className="text-4xl font-black text-white">142</h3>
            <p className="text-green-500 text-[10px] font-bold mt-2">↑ 12% mejor que ayer</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl border-l-4 border-l-red-500">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Críticos fuera de SLA</p>
            <h3 className="text-4xl font-black text-white">8</h3>
            <p className="text-red-500 text-[10px] font-bold mt-2">Acción inmediata requerida</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Técnicos Online</p>
            <h3 className="text-4xl font-black text-white">4<span className="text-slate-600 text-lg">/10</span></h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Disponibilidad TI</p>
            <h3 className="text-4xl font-black text-cyan-500">99.8%</h3>
          </div>
        </div>

        {/* PANEL DE GESTIÓN SLA (Solo Admin) */}
        <div className="bg-slate-950 border border-red-500/20 rounded-2xl p-6 shadow-2xl">
          <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            🚨 REASIGNACIÓN DE EMERGENCIA (RIESGO SLA)
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-red-500/50 transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-tighter italic">Vence en: 14 min</span>
                <span className="text-white font-bold text-sm">Falla en Servidor ERP - Planta 2</span>
                <span className="text-slate-500 text-[10px]">Asignado a: <b className="text-slate-400">Roberto Torres (Ocupado)</b></span>
              </div>
              <button className="bg-red-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-red-900/40">Reasignar</button>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-orange-500/50 transition-all">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter italic">Vence en: 32 min</span>
                <span className="text-white font-bold text-sm">Problema Acceso VPN Directivos</span>
                <span className="text-slate-500 text-[10px]">Asignado a: <b className="text-slate-400">Ana Gómez (Comiendo)</b></span>
              </div>
              <button className="bg-orange-500 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-orange-900/40">Reasignar</button>
            </div>
          </div>
        </div>

        {/* Monitor de Técnicos (Tabla Completa) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">Monitor de Staff en Vivo</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                <th className="pb-4">Técnico</th>
                <th className="pb-4">Estatus</th>
                <th className="pb-4">Carga</th>
                <th className="pb-4">SLA Mes</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-800/50">
                <td className="py-4 font-bold text-white uppercase">Roberto Torres</td>
                <td className="py-4"><span className="bg-green-500/10 text-green-500 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Activo</span></td>
                <td className="py-4 text-white font-bold">3 Tickets</td>
                <td className="py-4 text-green-500 font-bold">98%</td>
              </tr>
              <tr className="border-b border-slate-800/50">
                <td className="py-4 font-bold text-white uppercase">Ana Gómez</td>
                <td className="py-4"><span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Comiendo</span></td>
                <td className="py-4 text-white font-bold">8 Tickets</td>
                <td className="py-4 text-orange-500 font-bold">85%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. VISTA DE TÉCNICO (Panel de Operaciones)
  // ==========================================
  if (user?.rol === 'Tecnico') {
    return (
      <div className="animate-fadeIn space-y-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Estación de <span className="text-cyan-500">Trabajo</span></h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Gestión de tickets asignados y rendimiento personal</p>
          </div>
        </div>

        {/* KPIs del Técnico */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl border-l-4 border-l-cyan-500">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mis Tickets Activos</p>
            <h3 className="text-4xl font-black text-white">5</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl border-l-4 border-l-green-500">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resueltos este Mes</p>
            <h3 className="text-4xl font-black text-white">28</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl border-l-4 border-l-orange-500">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mi SLA Promedio</p>
            <h3 className="text-4xl font-black text-white">96%</h3>
          </div>
        </div>

        {/* Lista de Trabajo Inmediato para el Técnico */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Próximos Vencimientos (Mis Tickets)</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-white font-bold">Configuración de Impresora - Finanzas</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Solicitante: María López | Prioridad: Media</p>
              </div>
              <span className="text-xs font-black text-orange-400 bg-orange-400/10 px-3 py-1 rounded">Vence en 2h</span>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-white font-bold">Cambio de Mouse - Ventas</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Solicitante: Juan Pérez | Prioridad: Baja</p>
              </div>
              <span className="text-xs font-black text-slate-500 bg-slate-500/10 px-3 py-1 rounded">Vence en 24h</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. VISTA DE USUARIO NORMAL (Portal de Soporte)
  // ==========================================
  return (
    <div className="animate-fadeIn space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-black text-white mb-4 tracking-tighter italic">¡Hola, {primerNombre}! 👋</h1>
          <p className="text-slate-400 text-xl max-w-2xl leading-relaxed">
            Bienvenido a tu portal de soporte. Reporta una falla o revisa tus equipos.
          </p>
          <div className="flex gap-6 mt-10">
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center gap-4 transition-all transform hover:scale-105 shadow-2xl shadow-cyan-900/40">
              🚀 Reportar Problema
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-10 py-5 rounded-2xl font-black text-lg border border-slate-700">
              📚 Ver Tutoriales
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mis solicitudes</p>
          <h3 className="text-4xl font-black text-white">2</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mis Equipos</p>
          <h3 className="text-4xl font-black text-cyan-500">3</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl border-l-4 border-l-green-500">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estatus TI</p>
          <h3 className="text-xl font-black text-green-500 uppercase">Sin Alertas</h3>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;