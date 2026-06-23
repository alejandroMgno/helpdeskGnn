// frontend/src/views/dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import clienteAxios from '../api/axios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Dashboard = ({ user, setVista }) => {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [rangoFecha, setRangoFecha] = useState('mes');
  const [fechasLibres, setFechasLibres] = useState({ inicio: '', fin: '' });

  const isAdmin = user?.rol === 'Admin';
  const isTecnico = user?.rol === 'Tecnico';
  const isUsuario = user?.rol === 'Usuario';

  const fetchData = async () => {
    try {
      let params = {};
      const hoy = new Date();
      if (rangoFecha === 'dia') params.fecha_inicio = new Date(hoy.setHours(0,0,0,0)).toISOString();
      else if (rangoFecha === 'semana') params.fecha_inicio = new Date(hoy.setDate(hoy.getDate() - 7)).toISOString();
      else if (rangoFecha === 'mes') params.fecha_inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
      else if (rangoFecha === 'libre' && fechasLibres.inicio && fechasLibres.fin) {
        params.fecha_inicio = new Date(fechasLibres.inicio).toISOString();
        params.fecha_fin = new Date(fechasLibres.fin).toISOString();
      }

      const res = await clienteAxios.get('/dashboard/stats', { params });
      setData(res.data);
    } catch (error) {
      console.error("Error al cargar dashboard", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { fetchData(); }, [rangoFecha, fechasLibres]);

  useEffect(() => {
    let socket;
    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${window.location.hostname}:8000/api/v1/dashboard/ws/${user.id}`;
      
      console.log("Conectando WS Dashboard...", wsUrl);
      socket = new WebSocket(wsUrl);
      
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("Mensaje WS recibido:", msg);
          if (msg.type === 'update_dashboard') {
            console.log("Señal de actualización recibida, refrescando stats...");
            fetchData();
          }
        } catch (e) { console.error("Error procesando mensaje WS", e); }
      };

      socket.onopen = () => console.log("WS Dashboard Conectado ✅");
      socket.onerror = (err) => console.error("Error WS Dashboard ❌", err);
      socket.onclose = () => {
        console.log("WS Dashboard Cerrado, reintentando en 3s...");
        setTimeout(connectWS, 3000);
      };
    };
    
    connectWS();
    return () => { if (socket) socket.close(); };
  }, [user.id]); // 🔥 Depender de user.id para reconectar si cambia el usuario

  const stats = isAdmin ? data?.admin : isTecnico ? data?.tecnico : data?.usuario;

  if (cargando) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data || !stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-10 bg-white rounded-lg shadow-sm border border-slate-200">
           <p className="text-slate-800 font-bold">Error de Sincronización</p>
           <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase">Reintentar</button>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar-light bg-[#f8fafc]">
      
      {/* HEADER */}
      <div className="flex-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isAdmin ? 'Panel de Control Operativo' : isTecnico ? 'Mi Resumen Técnico' : 'Mi Portal de Servicio'}
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isAdmin ? 'Resumen general y métricas de desempeño.' : isTecnico ? 'Seguimiento de tus tareas y rendimiento personal.' : 'Estado de tus solicitudes y equipos asignados.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm mr-2">
            {[
              { id: 'dia', label: 'D' },
              { id: 'semana', label: 'W' },
              { id: 'mes', label: 'M' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setRangoFecha(t.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${rangoFecha === t.id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button onClick={() => setVista('tickets')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow font-medium text-sm transition flex items-center gap-2 whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isAdmin && (
          <>
            <KPICard label="Tickets Totales" value={stats.ticketsTotales} color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>} />
            <KPICard label="En Riesgo SLA" value={stats.criticosSLA} color="orange" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>} />
            <KPICard label="Técnicos Online" value={`${stats.tecnicosOnline}/${stats.tecnicosTotal}`} color="emerald" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} />
            <KPICard label="Valor Activos" value={formatCurrency(data.admin.valorActivos)} color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
          </>
        )}
        {isTecnico && (
          <>
            <KPICard label="Mis Tickets Activos" value={stats.activos} color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>} />
            <KPICard label="Resueltos (Periodo)" value={stats.resueltos} color="emerald" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
            <KPICard label="Mi Rating CSAT" value={`${stats.csat} ★`} color="amber" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>} />
            <KPICard label="SLA Global" value="98%" color="indigo" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} />
          </>
        )}
        {isUsuario && (
          <>
            <KPICard label="Mis Solicitudes" value={stats.solicitudes} color="blue" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>} />
            <KPICard label="Mis Equipos" value={stats.equipos} color="indigo" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>} />
            <KPICard label="Estatus Cuenta" value="Activa" color="emerald" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} />
            <KPICard label="Soporte VIP" value="Normal" color="slate" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z"></path></svg>} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* ANALYTICS CHARTS */}
          {!isUsuario && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <SectionHeader label={isAdmin ? 'Tendencia Global de Tickets' : 'Mi Productividad'} color="blue" />
              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.tendencia || data.admin.tendencia}>
                    <defs>
                      <linearGradient id="colorTk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                    <Tooltip />
                    <Area type="monotone" dataKey="tickets" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTk)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* MIS EQUIPOS (SOLO USUARIO) */}
          {isUsuario && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
                <SectionHeader label="Mis Equipos Asignados" color="indigo" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b">
                    <tr>
                      <th className="p-4">Equipo</th>
                      <th className="p-4">Serie</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.equiposList?.map((e, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-xs font-bold text-slate-700">{e.nombre}</td>
                        <td className="p-4 text-xs text-slate-500">{e.serie}</td>
                        <td className="p-4 text-xs text-slate-500">{e.tipo}</td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border border-emerald-100">{e.estatus}</span>
                        </td>
                      </tr>
                    ))}
                    {(!stats.equiposList || stats.equiposList.length === 0) && (
                      <tr>
                        <td colSpan="4" className="p-10 text-center text-slate-400 text-xs italic">No tienes equipos asignados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TICKETS RIESGO / VENCIMIENTOS */}
          {!isUsuario && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
                <SectionHeader label={isAdmin ? 'Tickets Críticos SLA (Global)' : 'Mis Próximos Vencimientos'} color="orange" />
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">SLA Monitor</span>
              </div>
              <div className="divide-y divide-slate-100">
                {stats.ticketsRiesgo?.map((t) => (
                  <div key={t.id} className="p-4 hover:bg-slate-50/80 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded border flex items-center justify-center font-bold text-xs shrink-0 ${t.color === 'red' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                        #{t.id}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{t.titulo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {isAdmin && (
                            <span className="text-[11px] text-slate-400 font-medium">Asignado: <span className="text-slate-600 font-bold">{t.asignado}</span></span>
                          )}
                          {!isAdmin && (
                            <span className="text-[11px] text-slate-400 font-medium uppercase font-bold tracking-tight">Vence Pronto</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`text-[11px] font-bold ${t.color === 'red' ? 'text-red-600' : 'text-orange-600'}`}>Vence en {t.venceEn}</p>
                      <button onClick={() => setVista('tickets')} className="mt-1 text-[10px] text-blue-600 font-bold hover:underline">Ver Ticket</button>
                    </div>
                  </div>
                ))}
                {(!stats.ticketsRiesgo || stats.ticketsRiesgo.length === 0) && (
                  <div className="p-10 text-center text-slate-400 text-sm font-medium italic">Todo bajo control.</div>
                )}
              </div>
            </div>
          )}

          {/* MONITOR DE AGENTES (SOLO ADMIN) */}
          {isAdmin && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/80">
                  <SectionHeader label="Estado de Agentes" color="blue" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200">
                  {stats.tecnicos?.map(tec => (
                    <div key={tec.id} className="bg-white p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {tec.nombre.substring(0,2).toUpperCase()}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${tec.color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{tec.nombre}</p>
                          <div className="flex items-center gap-1.5">
                             <span className={`w-2 h-2 rounded-full ${
                                tec.estatus === 'Activo' ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 
                                (tec.estatus === 'Ocupado' || tec.estatus === 'Vacaciones') ? 'bg-red-600 shadow-[0_0_5px_#ef4444]' : 
                                'bg-amber-500 shadow-[0_0_5px_#f59e0b]'
                             }`}></span>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{tec.estatus}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-700">{tec.carga}</p>
                          <p className="text-[10px] text-emerald-600 font-bold">Rating: {tec.sla}</p>
                        </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* MANTENIMIENTOS (ADMIN) */}
           {isAdmin && stats.mantenimientos?.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-indigo-50/30">
                <SectionHeader label="Próximos Mantenimientos" color="indigo" />
              </div>
              <div className="divide-y divide-slate-100">
                {stats.mantenimientos.slice(0, 5).map((m, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-all flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{m.nombre}</p>
                      <p className="text-[10px] font-bold text-red-600 uppercase mt-1">Atraso: {m.atraso}d</p>
                    </div>
                    <button onClick={() => setVista('inventario')} className="text-[10px] font-bold text-indigo-600 hover:underline">Gestionar</button>
                  </div>
                ))}
              </div>
            </div>
           )}

           {/* LIVE ACTIVITY */}
           <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
              <SectionHeader label={isAdmin ? 'Actividad Global' : 'Mi Actividad'} color="blue" />
              <div className="space-y-6 relative mt-6">
                 <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                 {stats.actividad?.map((act, i) => (
                    <div key={i} className="flex gap-4 relative">
                       <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 z-10 shadow-sm text-[10px] font-bold text-blue-600">
                          {act.usuario.substring(0,2).toUpperCase()}
                       </div>
                       <div className="min-w-0">
                          <p className="text-[12px] font-bold text-slate-800 leading-tight">
                             <span className="text-blue-600">{act.usuario}</span> {act.accion.toLowerCase()}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-tight">
                             {act.tabla} • {new Date(act.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                    </div>
                 ))}
                 {(!stats.actividad || stats.actividad.length === 0) && (
                    <p className="text-center text-slate-400 text-xs italic py-4">Sin actividad reciente.</p>
                 )}
              </div>
           </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-light::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

const KPICard = ({ label, value, icon, color }) => (
  <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-center mb-4">
      <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600 border border-${color}-100`}>
        {icon}
      </div>
      <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-${color}-50/50 text-${color}-700 border border-${color}-200`}>En Vivo</span>
    </div>
    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
  </div>
);

const SectionHeader = ({ label, color }) => (
    <p className={`text-[10px] font-bold text-${color}-600 uppercase tracking-[0.3em] flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full bg-${color}-500`}></span> {label}
    </p>
);

export default Dashboard;