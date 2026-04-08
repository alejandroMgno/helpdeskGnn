// frontend/src/views/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import clienteAxios from '../api/axios';

const Dashboard = ({ user, setVista }) => {
  const primerNombre = user?.nombre_completo ? user.nombre_completo.split(' ')[0] : 'Usuario';

  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerEstadisticas = async () => {
      try {
        const res = await clienteAxios.get('/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Error al obtener estadísticas del dashboard:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerEstadisticas();
  }, []);

  // ==========================================
  // FUNCIONES DE BOTONES (Admin)
  // ==========================================
  const handleGenerarReporte = () => {
    // Abre el diálogo de impresión del navegador para exportar a PDF
    window.print();
  };

  const handleReasignar = (nombreTicket) => {
    // Alerta temporal: Aquí abriremos un modal en el futuro
    alert(`Abriendo panel de reasignación para:\n\n📋 ${nombreTicket}\n\n(Esta función se conectará al motor SLA pronto para elegir un nuevo técnico).`);
  };

  if (cargando || !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // ==========================================
  // 1. VISTA DE ADMINISTRADOR (Torre de Control Total)
  // ==========================================
  if (user?.rol === 'Admin') {
    const dataAdmin = stats.admin;

    return (
      <div className="animate-fadeIn space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">Torre de Control <span className="text-cyan-500">Global</span></h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Supervisión Total de Infraestructura y SLAs</p>
          </div>
          {/* BOTÓN CONECTADO: Generar Reporte PDF */}
          <button
            onClick={handleGenerarReporte}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest transition shadow-lg shadow-cyan-900/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Generar Reporte PDF
          </button>
        </div>

        {/* KPIs Globales (Conectados al Backend) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tickets Totales</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-white leading-none">{dataAdmin.ticketsTotales}</h3>
              <p className="text-green-500 text-xs font-bold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                12%
              </p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm border-l-4 border-l-red-500 hover:border-slate-700 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Críticos fuera de SLA</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-white leading-none">{dataAdmin.criticosSLA}</h3>
              <p className="text-red-500 text-[10px] font-bold">¡Acción Requerida!</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Técnicos Online</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-white leading-none">{dataAdmin.tecnicosOnline}<span className="text-slate-500 text-xl font-bold">/{dataAdmin.tecnicosTotal}</span></h3>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm hover:border-slate-700 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Disponibilidad TI</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-cyan-500 leading-none">99.8%</h3>
            </div>
          </div>
        </div>

        {/* PANEL DE GESTIÓN SLA (Estructura Original) */}
        <div className="bg-slate-900/50 border border-red-500/30 rounded-xl p-5 shadow-inner">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">Reasignación de Emergencia (Riesgo SLA)</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-red-500/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-500/10 text-red-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Vence: 14 min</span>
                </div>
                <h4 className="text-white font-bold text-sm">Falla en Servidor ERP - Planta 2</h4>
                <p className="text-slate-400 text-xs mt-1">Asignado: <span className="text-slate-300 font-semibold">Roberto Torres (Ocupado)</span></p>
              </div>
              {/* BOTÓN CONECTADO: Reasignar 1 */}
              <button
                onClick={() => handleReasignar('Falla en Servidor ERP - Planta 2')}
                className="w-full sm:w-auto bg-slate-800 hover:bg-red-600 text-white border border-slate-700 hover:border-red-600 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Reasignar
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:border-orange-500/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Vence: 32 min</span>
                </div>
                <h4 className="text-white font-bold text-sm">Problema Acceso VPN Directivos</h4>
                <p className="text-slate-400 text-xs mt-1">Asignado: <span className="text-slate-300 font-semibold">Ana Gómez (Comiendo)</span></p>
              </div>
              {/* BOTÓN CONECTADO: Reasignar 2 */}
              <button
                onClick={() => handleReasignar('Problema Acceso VPN Directivos')}
                className="w-full sm:w-auto bg-slate-800 hover:bg-orange-600 text-white border border-slate-700 hover:border-orange-600 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Reasignar
              </button>
            </div>
          </div>
        </div>

        {/* Monitor de Técnicos (Estructura Original) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20">
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Monitor de Staff en Vivo</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                  <th className="px-6 py-3">Técnico</th>
                  <th className="px-6 py-3">Estatus</th>
                  <th className="px-6 py-3">Carga Actual</th>
                  <th className="px-6 py-3 w-1/4">SLA Mensual</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">Roberto Torres</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Activo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">3 Tickets</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full w-[98%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 w-8 text-right">98%</span>
                    </div>
                  </td>
                </tr>
                <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">Ana Gómez</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Comiendo
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">8 Tickets</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full w-[85%]"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-400 w-8 text-right">85%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. VISTA DE TÉCNICO (Panel de Operaciones)
  // ==========================================
  if (user?.rol === 'Tecnico') {
    const dataTecnico = stats.tecnico;
    return (
      <div className="animate-fadeIn space-y-8">
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">Estación de <span className="text-cyan-500">Trabajo</span></h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Gestión de tickets asignados y rendimiento personal</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl border-t-4 border-t-cyan-500 shadow-sm hover:bg-slate-800/50 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mis Tickets Activos</p>
            <h3 className="text-4xl font-black text-white">{dataTecnico.activos}</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl border-t-4 border-t-green-500 shadow-sm hover:bg-slate-800/50 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Resueltos este Mes</p>
            <h3 className="text-4xl font-black text-white">{dataTecnico.resueltos}</h3>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl border-t-4 border-t-orange-500 shadow-sm hover:bg-slate-800/50 transition-colors">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mi SLA Promedio</p>
            <h3 className="text-4xl font-black text-white">{dataTecnico.sla}</h3>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. VISTA DE USUARIO NORMAL (Portal de Soporte)
  // ==========================================
  const dataUsuario = stats.usuario;
  return (
    <div className="animate-fadeIn space-y-8">
      <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">¡Hola, {primerNombre}! 👋</h1>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed">Bienvenido a tu portal de servicios TI. Estamos aquí para ayudarte a mantener tus herramientas funcionando al 100%.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button onClick={() => setVista('tickets')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-900/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Reportar Problema
            </button>
            <button onClick={() => setVista('conocimiento')} className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-6 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              Ver Tutoriales
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm flex flex-col justify-between hover:bg-slate-800/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mis Solicitudes</p>
            <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></span>
          </div>
          <h3 className="text-3xl font-black text-white">{dataUsuario.solicitudes} <span className="text-sm font-medium text-slate-500 ml-1">Abiertas</span></h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm flex flex-col justify-between hover:bg-slate-800/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mis Equipos</p>
            <span className="p-1.5 bg-cyan-500/10 text-cyan-500 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></span>
          </div>
          <h3 className="text-3xl font-black text-white">{dataUsuario.equipos} <span className="text-sm font-medium text-slate-500 ml-1">Asignados</span></h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm border-l-4 border-l-green-500 flex flex-col justify-between hover:bg-slate-800/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estatus TI</p>
            <span className="p-1.5 bg-green-500/10 text-green-500 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg></span>
          </div>
          <h3 className="text-xl font-black text-green-500 uppercase tracking-tight">{dataUsuario.estatus}</h3>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;