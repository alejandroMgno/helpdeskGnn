// frontend/src/views/mesaAyuda.jsx
import React, { useState, useEffect, useRef } from 'react';
import clienteAxios from '../api/axios';

const MesaAyuda = ({ user }) => {
  // Estados Reales de Datos (Conectados a BD)
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({}); // Conteo por estatus
  const [comentarios, setComentarios] = useState([]);
  const [activosUsuario, setActivosUsuario] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [slaConfigs, setSlaConfigs] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Referencias para los inputs de archivos ocultos
  const fileInputChatRef = useRef(null);
  const fileInputTicketRef = useRef(null);

  // Estados de Interfaz
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("all");
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const busquedaRef = useRef("");
  useEffect(() => { busquedaRef.current = busqueda; }, [busqueda]);

  const [skipCerrados, setSkipCerrados] = useState(0);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [ticketsHistorial, setTicketsHistorial] = useState([]);
  const [statsHistorial, setStatsHistorial] = useState(null);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [filtrosHistorial, setFiltrosHistorial] = useState({
    ticket_id: '',
    usuario_nombre: '',
    tecnico_id: '',
    asunto: '',
    departamento: '',
    prioridad: '',
    fecha_desde: '',
    fecha_hasta: '',
    estatus: 'Cerrado'
  });
  const [paginaHistorial, setPaginaHistorial] = useState(0);
  const limitHistorial = 15;

  const [formTicket, setFormTicket] = useState({ titulo: '', departamento: 'Soporte N1', prioridad: 'Media', activo_id: '', descripcion: '' });
  const [estrellas, setEstrellas] = useState(0);
  const [feedback, setFeedback] = useState("");

  // Referencia para el auto-scroll
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [comentarios]);

  // ==========================================
  // 1. OBTENER DATOS AL CARGAR
  // ==========================================
  const fetchTickets = async () => {
    const query = busquedaRef.current;
    const tecId = filtroTecnico;
    try {
      let urlActivos = `/tickets/?limit=100`;
      let urlCounts = `/tickets/stats/counts`;

      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (tecId) params.append('tecnico_id', tecId);

      const queryString = params.toString();
      if (queryString) {
        urlActivos += `&${queryString}`;
        urlCounts += `?${queryString}`;
      }

      const [resActivos, resCounts] = await Promise.all([
        clienteAxios.get(urlActivos),
        clienteAxios.get(urlCounts)
      ]);

      // Filtrar para el Kanban (No cerrados)
      const activos = resActivos.data.filter(t => t.estatus !== 'Cerrado' && t.estatus !== 'Cancelado');
      setTickets(activos);
      setCounts(resCounts.data);
    } catch (error) { console.error(error); }
  };

  // Debounce para la búsqueda y filtro técnico
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTickets();
    }, 500);
    return () => clearTimeout(timer);
  }, [busqueda, filtroTecnico]);

  const fetchHistorial = async (reset = false) => {
    setCargandoHistorial(true);
    const nuevaPagina = reset ? 0 : paginaHistorial;
    if (reset) setPaginaHistorial(0);

    try {
      const params = new URLSearchParams();
      params.append('skip', nuevaPagina * limitHistorial);
      params.append('limit', limitHistorial);
      
      if (filtrosHistorial.ticket_id) params.append('q', filtrosHistorial.ticket_id);
      if (filtrosHistorial.usuario_nombre) params.append('q', filtrosHistorial.usuario_nombre);
      if (filtrosHistorial.asunto) params.append('q', filtrosHistorial.asunto);
      
      if (filtrosHistorial.tecnico_id) params.append('tecnico_id', filtrosHistorial.tecnico_id);
      if (filtrosHistorial.prioridad) params.append('prioridad', filtrosHistorial.prioridad);
      if (filtrosHistorial.departamento) params.append('departamento', filtrosHistorial.departamento);
      if (filtrosHistorial.fecha_desde) params.append('fecha_desde', filtrosHistorial.fecha_desde);
      if (filtrosHistorial.fecha_hasta) params.append('fecha_hasta', filtrosHistorial.fecha_hasta);
      if (filtrosHistorial.estatus) params.append('estatus', filtrosHistorial.estatus);

      const [res, resStats] = await Promise.all([
        clienteAxios.get(`/tickets/?${params.toString()}`),
        clienteAxios.get('/tickets/stats/history')
      ]);

      setTicketsHistorial(res.data);
      setStatsHistorial(resStats.data);
    } catch (error) {
      console.error(error);
    } finally {
      setCargandoHistorial(false);
    }
  };

  const reabrirTicket = async (id) => {
    if (!window.confirm("¿Reabrir este ticket? Pasará a estado Abierto.")) return;
    try {
      await clienteAxios.post(`/tickets/${id}/reabrir`);
      fetchHistorial();
      fetchTickets();
      alert("Ticket reabierto correctamente.");
    } catch (error) {
      alert("Error al reabrir ticket");
    }
  };

  useEffect(() => {
    if (mostrarHistorial) fetchHistorial(true);
  }, [mostrarHistorial]);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        await fetchTickets();
        const [resActivos, resUsuarios, resSla] = await Promise.all([
          clienteAxios.get('/activos/'),
          user?.rol === 'Admin' ? clienteAxios.get('/usuarios/') : Promise.resolve({ data: [] }),
          clienteAxios.get('/catalogos/sla')
        ]);
        setActivosUsuario(resActivos.data);
        setSlaConfigs(resSla.data);
        if (user?.rol === 'Admin') {
          setTecnicos(resUsuarios.data.filter(u => u.rol === 'Tecnico'));
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarDatosIniciales();
  }, [user?.rol]);

  // ==========================================
  // 2. WEBSOCKETS
  // ==========================================
  const ws = useRef(null);
  const wsGlobal = useRef(null);
  const ticketsRef = useRef(tickets);
  useEffect(() => { ticketsRef.current = tickets; }, [tickets]);

  useEffect(() => {
    let timeoutId;
    const connectGlobalWS = () => {
      if (!user?.id) return;
      
      const wsUrl = `ws://${window.location.hostname}:8000/api/v1/tickets/ws/notifications/${user.id}`;
      wsGlobal.current = new WebSocket(wsUrl);

      wsGlobal.current.onopen = () => console.log("MesaAyuda: Global WS Conectado ✅");

      wsGlobal.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'notification' && Notification.permission === "granted") {
          new Notification(msg.title, { body: msg.body, icon: '/favicon.svg' });
        }
        if (msg.type === 'update_dashboard') {
          console.log("Evento global detectado, actualizando tablero...");
          fetchTickets();
        }
      };

      wsGlobal.current.onclose = () => {
        console.log("MesaAyuda: Global WS Desconectado. Reintentando en 3s...");
        timeoutId = setTimeout(connectGlobalWS, 3000);
      };

      wsGlobal.current.onerror = (err) => console.error("MesaAyuda: Global WS Error", err);
    };

    connectGlobalWS();
    return () => {
      if (wsGlobal.current) {
        wsGlobal.current.onclose = null; // Evitar reconexión al desmontar
        wsGlobal.current.close();
      }
      clearTimeout(timeoutId);
    };
  }, [user?.id]);

  useEffect(() => {
    if (ticketSeleccionado) {
      if (ws.current) ws.current.close();
      const socketUrl = `ws://${window.location.hostname}:8000/api/v1/tickets/ws/${ticketSeleccionado.id}`;
      ws.current = new WebSocket(socketUrl);
      
      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'comentario_nuevo') {
          setComentarios((prev) => {
            if (prev.find(c => c.id === message.data.id)) return prev;
            return [...prev, message.data];
          });
        }
        if (message.type === 'ticket_actualizado') {
          console.log("Ticket actualizado en tiempo real:", message.data);
          // Actualizar el ticket seleccionado para que el detalle se vea al día
          setTicketSeleccionado(prev => {
            if (prev && prev.id === message.data.id) {
              return { ...prev, estatus: message.data.estatus, tecnico_asignado_id: message.data.tecnico_asignado_id };
            }
            return prev;
          });
          // También refrescar la lista general para mover el ticket en el Kanban
          fetchTickets();
        }
      };
      return () => { if (ws.current) ws.current.close(); };
    }
  }, [ticketSeleccionado?.id]);

  const abrirTicket = async (ticket) => {
    setTicketSeleccionado(ticket);
    setComentarios([]);
    setFeedback("");
    setEstrellas(0);
    try {
      const res = await clienteAxios.get(`/tickets/${ticket.id}/comentarios`);
      setComentarios(res.data);
    } catch (error) { console.error(error); }
  };

  // ==========================================
  // 3. ACCIONES TICKET
  // ==========================================
  const manejarCreacionTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await clienteAxios.post('/tickets/', { ...formTicket, activo_id: formTicket.activo_id ? parseInt(formTicket.activo_id) : null });
      setMostrarModalNuevo(false);
      setFormTicket({ titulo: '', departamento: 'Soporte N1', prioridad: 'Media', activo_id: '', descripcion: '' });
      // Refrescar lista completa para asegurar consistencia con filtros/roles
      fetchTickets();
      alert("Ticket creado con éxito.");
    } catch (error) { 
      console.error(error);
      alert(error.response?.data?.detail || "Error al crear ticket"); 
    }
  };

  const actualizarEstatusTicket = async (ticketId, nuevoEstatus) => {
    const ticketsAnteriores = [...tickets];
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, estatus: nuevoEstatus } : t));
    try {
      await clienteAxios.put(`/tickets/${ticketId}/estatus`, { nuevo_estatus: nuevoEstatus });
    } catch (error) {
      setTickets(ticketsAnteriores);
      alert("No se pudo actualizar el estatus.");
    }
  };

  const reasignarTecnico = async (nuevoTecnicoId) => {
    try {
      await clienteAxios.put(`/tickets/${ticketSeleccionado.id}`, { tecnico_asignado_id: parseInt(nuevoTecnicoId) });
      setTicketSeleccionado({ ...ticketSeleccionado, tecnico_asignado_id: parseInt(nuevoTecnicoId) });
      fetchTickets();
      alert("Ticket reasignado.");
    } catch (error) { alert("Error al reasignar."); }
  };

  const cambiarPrioridad = async (nuevaPrioridad) => {
    try {
      const res = await clienteAxios.put(`/tickets/${ticketSeleccionado.id}`, { prioridad: nuevaPrioridad });
      setTicketSeleccionado(res.data);
      fetchTickets();
      alert("Prioridad y SLA actualizados.");
    } catch (error) { alert("Error al actualizar prioridad."); }
  };

  const cambiarEstatusSelect = async (nuevoEstatus) => {
    await actualizarEstatusTicket(ticketSeleccionado.id, nuevoEstatus);
    abrirTicket({ ...ticketSeleccionado, estatus: nuevoEstatus });
  };

  // ==========================================
  // DRAG & DROP
  // ==========================================
  const [ticketArrastrado, setTicketArrastrado] = useState(null);
  const onDragStart = (e, t) => { setTicketArrastrado(t); e.target.classList.add('opacity-50'); };
  const onDragEnd = (e) => { e.target.classList.remove('opacity-50'); setTicketArrastrado(null); };
  const onDrop = async (e, estatus) => {
    e.preventDefault();
    if (ticketArrastrado && ticketArrastrado.estatus !== estatus) {
      await actualizarEstatusTicket(ticketArrastrado.id, estatus);
    }
  };

  // ==========================================
  // UI HELPERS
  // ==========================================
  const enviarCalificacion = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post(`/tickets/${ticketSeleccionado.id}/calificar?estrellas=${estrellas}&comentario=${encodeURIComponent(feedback)}`);
      setTicketSeleccionado({ ...ticketSeleccionado, satisfaccion_estrellas: estrellas, satisfaccion_comentario: feedback });
      // Ya no cambiamos a Cerrado aquí localmente, esperamos al botón de Cerrar
      fetchTickets();
    } catch (error) { console.error(error); }
  };

  const cerrarTicketDefinitivo = async () => {
    if (!window.confirm("¿Deseas cerrar formalmente este ticket? Ya no podrás agregar comentarios.")) return;
    try {
      await clienteAxios.post(`/tickets/${ticketSeleccionado.id}/cerrar`);
      setTicketSeleccionado({ ...ticketSeleccionado, estatus: 'Cerrado' });
      fetchTickets();
      alert("Ticket cerrado con éxito.");
    } catch (error) {
      alert(error.response?.data?.detail || "Error al cerrar el ticket");
    }
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post(`/tickets/${ticketSeleccionado.id}/comentarios`, { texto: nuevoComentario });
      setNuevoComentario("");
      abrirTicket(ticketSeleccionado);
    } catch (error) { console.error(error); }
  };

  const getPrioridadColor = (p) => {
    if (!p) return { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200' };
    if (p.includes('Crítica')) return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' };
    if (p.includes('Alta')) return { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' };
    return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' };
  };

  const columnasKanban = [
    { id: 'Abierto', titulo: 'Nuevos', accent: 'bg-blue-500' },
    { id: 'En Progreso', titulo: 'Proceso', accent: 'bg-orange-500' },
    { id: 'Resuelto', titulo: 'Resueltos', accent: 'bg-emerald-500' },
    { id: 'Cerrado', titulo: 'Cerrados', accent: 'bg-slate-500' }
  ];

  const ticketsFiltrados = tickets.filter(t => t.titulo.toLowerCase().includes(busqueda.toLowerCase()) || t.id.toString().includes(busqueda));

  if (cargando) return <div className="h-full flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="h-full flex flex-col">
      {/* HEADER */}
      <div className="flex-none flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{user?.rol === 'Admin' ? 'Helpdesk Board' : user?.rol === 'Tecnico' ? 'Mi Tablero' : 'Mis Solicitudes'}</h1>
          <p className="text-sm text-slate-500">Gestión inteligente de soporte técnico.</p>
        </div>
        <div className="flex gap-3">
          {user?.rol === 'Admin' && (
            <select 
              value={filtroTecnico} 
              onChange={e => setFiltroTecnico(e.target.value)}
              className="bg-white border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Todos los técnicos</option>
              {tecnicos.map(t => (
                <option key={t.id} value={t.id}>{t.nombre_completo}</option>
              ))}
            </select>
          )}
          <input type="text" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="bg-white border border-slate-300 rounded px-3 py-2 text-sm" />
          <button onClick={() => setMostrarHistorial(true)} className="bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold shadow-sm flex items-center gap-2 group hover:bg-slate-700 transition-all">
            <svg className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Historial
          </button>
          <button onClick={() => setMostrarModalNuevo(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold shadow-sm">Nuevo Ticket</button>
        </div>
      </div>

      {/* KANBAN */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {columnasKanban.filter(c => c.id !== 'Cerrado').map(col => (
            <div key={col.id} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, col.id)} className="w-[300px] flex flex-col bg-slate-100/50 border border-slate-200 rounded-lg transition-all">
              <div className="p-3 border-b border-slate-200 flex justify-between items-center bg-white/50 rounded-t-lg">
                <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${col.accent}`}></div><h3 className="text-sm font-bold text-slate-700">{col.titulo}</h3></div>
                <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {busqueda ? ticketsFiltrados.filter(t => t.estatus === col.id).length : (counts[col.id] || 0)}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {ticketsFiltrados.filter(t => t.estatus === col.id).map(ticket => (
                  <div key={ticket.id} draggable={['Admin', 'Tecnico'].includes(user?.rol)} onDragStart={e => onDragStart(e, ticket)} onDragEnd={onDragEnd} onClick={() => abrirTicket(ticket)} className={`bg-white border-l-4 ${
                    ticket.sla_estado_visual === 'vencido' ? 'border-l-red-600' :
                    ticket.sla_estado_visual === 'rojo' ? 'border-l-orange-500' :
                    ticket.sla_estado_visual === 'amarillo' ? 'border-l-amber-400' :
                    ticket.sla_estado_visual === 'verde' ? 'border-l-emerald-500' : 'border-l-slate-200'
                  } border-y-slate-200 border-r-slate-200 p-3 rounded shadow-sm hover:border-blue-400 cursor-pointer transition-all`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-slate-400">TK-{ticket.id}</span>
                      <div className="flex gap-1">
                        {ticket.sla_estado_visual && (
                           <span className={`w-2 h-2 rounded-full mt-1 ${
                              ticket.sla_estado_visual === 'vencido' ? 'bg-red-600' :
                              ticket.sla_estado_visual === 'rojo' ? 'bg-orange-500' :
                              ticket.sla_estado_visual === 'amarillo' ? 'bg-amber-400' : 'bg-emerald-500'
                           }`}></span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPrioridadColor(ticket.prioridad).bg} ${getPrioridadColor(ticket.prioridad).text}`}>
                          {ticket.prioridad.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-2">{ticket.titulo}</h4>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                       <span className="text-[10px] text-slate-500 font-medium">Por: <span className="font-bold text-slate-700">{ticket.solicitante?.nombre_completo}</span></span>
                       <span className="text-[10px] text-slate-400">{new Date(ticket.fecha_creacion).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL HISTORIAL */}
      {mostrarHistorial && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-slate-50 rounded-[2rem] shadow-2xl w-[90%] h-[90%] flex flex-col overflow-hidden border border-white/20">
            <div className="p-6 border-b bg-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Historial de Tickets</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Consulta y gestión de tickets finalizados</p>
              </div>
              <button onClick={() => setMostrarHistorial(false)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* STATS HISTORIAL */}
              {statsHistorial && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cerrados</p>
                    <p className="text-2xl font-black text-slate-800">{statsHistorial.total_cerrados}</p>
                  </div>
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Promedio Resolución</p>
                    <p className="text-2xl font-black text-blue-600">{statsHistorial.avg_resolucion_horas}h</p>
                  </div>
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tickets Reabiertos</p>
                    <p className="text-2xl font-black text-orange-500">{statsHistorial.total_reabiertos}</p>
                  </div>
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Satisfacción</p>
                    <p className="text-2xl font-black text-emerald-500">{statsHistorial.satisfaccion_promedio} ★</p>
                  </div>
                </div>
              )}

              {/* FILTROS AVANZADOS */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ticket # / Usuario / Asunto</label>
                    <input 
                      type="text" 
                      placeholder="Buscar..." 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 ring-blue-500/20"
                      value={filtrosHistorial.ticket_id}
                      onChange={e => setFiltrosHistorial({...filtrosHistorial, ticket_id: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Técnico</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none"
                      value={filtrosHistorial.tecnico_id}
                      onChange={e => setFiltrosHistorial({...filtrosHistorial, tecnico_id: e.target.value})}
                    >
                      <option value="">Todos</option>
                      {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Prioridad</label>
                    <select 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none"
                      value={filtrosHistorial.prioridad}
                      onChange={e => setFiltrosHistorial({...filtrosHistorial, prioridad: e.target.value})}
                    >
                      <option value="">Todas</option>
                      <option value="Crítica">Crítica</option>
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Desde</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none"
                      value={filtrosHistorial.fecha_desde}
                      onChange={e => setFiltrosHistorial({...filtrosHistorial, fecha_desde: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Hasta</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold outline-none"
                      value={filtrosHistorial.fecha_hasta}
                      onChange={e => setFiltrosHistorial({...filtrosHistorial, fecha_hasta: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setFiltrosHistorial({ ticket_id: '', usuario_nombre: '', tecnico_id: '', asunto: '', departamento: '', prioridad: '', fecha_desde: '', fecha_hasta: '', estatus: 'Cerrado' });
                      fetchHistorial(true);
                    }}
                    className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Limpiar Filtros
                  </button>
                  <button 
                    onClick={() => fetchHistorial(true)}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                  >
                    Buscar Tickets
                  </button>
                </div>
              </div>

              {/* TABLA DE RESULTADOS */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ticket</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asunto</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnico</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridad</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Creado</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cerrado</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ticketsHistorial.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 text-xs font-black text-slate-400">#{t.id}</td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-700 max-w-[200px] truncate">{t.titulo}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-600">{t.solicitante?.nombre_completo}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-blue-600">{t.tecnico?.nombre_completo || 'Sin asignar'}</p>
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${getPrioridadColor(t.prioridad).bg} ${getPrioridadColor(t.prioridad).text}`}>
                            {t.prioridad}
                          </span>
                        </td>
                        <td className="p-4 text-[10px] font-bold text-slate-400">{new Date(t.fecha_creacion).toLocaleDateString()}</td>
                        <td className="p-4 text-[10px] font-bold text-emerald-600">{t.fecha_resolucion ? new Date(t.fecha_resolucion).toLocaleDateString() : '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button onClick={() => { setMostrarHistorial(false); abrirTicket(t); }} title="Ver detalle" className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm group/btn">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                              </svg>
                            </button>
                            <button onClick={() => reabrirTicket(t.id)} title="Reabrir ticket" className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center hover:bg-orange-600 hover:text-white transition-all shadow-sm group/btn">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                              </svg>
                            </button>
                            <button title="Imprimir" className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all shadow-sm group/btn">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H7a2 2 0 00-2 2v4a2 2 0 002 2z"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {ticketsHistorial.length === 0 && (
                      <tr>
                        <td colSpan="8" className="p-12 text-center">
                          <svg className="w-12 h-12 text-slate-200 mb-2 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                          </svg>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No se encontraron tickets con esos filtros</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando página {paginaHistorial + 1}</p>
                <div className="flex gap-2">
                  <button 
                    disabled={paginaHistorial === 0}
                    onClick={() => { setPaginaHistorial(prev => prev - 1); fetchHistorial(); }}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button 
                    disabled={ticketsHistorial.length < limitHistorial}
                    onClick={() => { setPaginaHistorial(prev => prev + 1); fetchHistorial(); }}
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR DETALLE */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full md:w-[700px] bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Detalle Ticket #{ticketSeleccionado.id}</h2>
              <button onClick={() => setTicketSeleccionado(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto p-6 space-y-4">
                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-2">{ticketSeleccionado.titulo}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{ticketSeleccionado.descripcion}</p>
                </div>
                {comentarios.map(c => (
                  <div key={c.id} className="bg-white p-3 rounded border border-slate-200 text-sm shadow-sm">
                    <div className="flex justify-between mb-1"><span className="font-bold text-blue-600">{c.autor}</span><span className="text-[10px] text-slate-400">{c.fecha}</span></div>
                    <p className="text-slate-700">{c.texto}</p>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="w-64 border-l p-4 space-y-6 bg-white overflow-y-auto">
                {/* CALIFICACIÓN */}
                {ticketSeleccionado.estatus === 'Resuelto' && ticketSeleccionado.solicitante_id === user?.id && (
                  <div className="bg-amber-50 p-3 rounded border border-amber-200 text-center">
                    <p className="text-xs font-bold text-amber-800 mb-2">¡Califica el servicio!</p>
                    <div className="flex justify-center gap-1 mb-2">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setEstrellas(s)} className={`text-xl ${estrellas >= s ? 'text-amber-500' : 'text-slate-300'}`}>★</button>)}</div>
                    <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Deja un comentario..."
                      className="w-full text-[10px] border rounded p-1.5 mb-2 outline-none focus:border-amber-400"
                      rows="2"
                    ></textarea>
                    <button onClick={enviarCalificacion} className="w-full bg-amber-500 text-white py-1 rounded text-xs font-bold">Enviar</button>
                  </div>
                )}

                {/* INFO DE CALIFICACIÓN (Si ya está calificado) */}
                {ticketSeleccionado.satisfaccion_estrellas && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                    <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Servicio Calificado</h3>
                    <div className="flex gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`text-lg ${ticketSeleccionado.satisfaccion_estrellas >= star ? 'text-emerald-500' : 'text-slate-300'}`}>★</span>
                      ))}
                    </div>
                    {ticketSeleccionado.satisfaccion_comentario && (
                      <p className="text-[11px] italic text-emerald-700 bg-white/50 p-2 rounded border border-emerald-100">{ticketSeleccionado.satisfaccion_comentario}</p>
                    )}
                    
                    {/* Botón para cerrar definitivamente si está resuelto */}
                    {ticketSeleccionado.estatus === 'Resuelto' && ticketSeleccionado.solicitante_id === user?.id && (
                      <button 
                        onClick={cerrarTicketDefinitivo}
                        className="w-full mt-4 bg-emerald-600 text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                      >
                        Cerrar Ticket Formalmente
                      </button>
                    )}
                  </div>
                )}

                {/* ESTATUS */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Estatus</label>
                  {['Admin', 'Tecnico'].includes(user?.rol) && !['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus) ? (
                    <select value={ticketSeleccionado.estatus} onChange={e => cambiarEstatusSelect(e.target.value)} className="w-full border rounded p-1.5 text-sm">
                      <option value="Abierto">Abierto</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Escalado a Desarrollo">Escalar a Desarrollo</option>
                      <option value="Escalado a Infraestructura">Escalar a Infraestructura</option>
                      <option value="Escalado a Redes">Escalar a Redes</option>
                      <option value="Resuelto">Resuelto</option>
                      <option value="Cerrado">Cerrado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  ) : (
                    <div className={`text-sm font-bold p-2 rounded ${
                        ticketSeleccionado.estatus === 'Cerrado' ? 'bg-slate-100 text-slate-500' : 
                        ticketSeleccionado.estatus === 'Cancelado' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-700'
                    }`}>
                        {ticketSeleccionado.estatus}
                    </div>
                  )}
                  {user?.rol === 'Usuario' && ['Abierto', 'En Progreso'].includes(ticketSeleccionado.estatus) && (
                    <button onClick={() => { if(window.confirm('¿Cancelar?')) cambiarEstatusSelect('Cancelado'); }} className="w-full mt-2 text-red-600 text-xs font-bold border border-red-200 py-1.5 rounded">Cancelar Ticket</button>
                  )}
                </div>

                {/* REASIGNACIÓN ADMIN */}
                {user?.rol === 'Admin' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Técnico Asignado</label>
                    <select value={ticketSeleccionado.tecnico_asignado_id || ""} onChange={e => reasignarTecnico(e.target.value)} className="w-full border rounded p-1.5 text-sm">
                      <option value="">-- Sin asignar --</option>
                      {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                    </select>
                  </div>
                )}

                {/* PRIORIDAD / SLA */}
                {['Admin', 'Tecnico'].includes(user?.rol) && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Prioridad (SLA)</label>
                    <select value={ticketSeleccionado.prioridad} onChange={e => cambiarPrioridad(e.target.value)} className="w-full border rounded p-1.5 text-sm">
                      {slaConfigs.map(config => (
                        <option key={config.id} value={config.prioridad}>{config.prioridad} ({config.horas}h)</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* INDICADORES SLA */}
                {ticketSeleccionado.sla_cumplimiento_porcentaje !== null && (
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Cumplimiento SLA</label>
                      <span className={`text-[10px] font-black uppercase ${
                        ticketSeleccionado.sla_estado_visual === 'vencido' ? 'text-red-600' :
                        ticketSeleccionado.sla_estado_visual === 'rojo' ? 'text-orange-600' :
                        ticketSeleccionado.sla_estado_visual === 'amarillo' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {ticketSeleccionado.sla_estado_visual}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          ticketSeleccionado.sla_estado_visual === 'vencido' ? 'bg-red-600' :
                          ticketSeleccionado.sla_estado_visual === 'rojo' ? 'bg-orange-500' :
                          ticketSeleccionado.sla_estado_visual === 'amarillo' ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(ticketSeleccionado.sla_cumplimiento_porcentaje, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 text-right font-bold">{ticketSeleccionado.sla_cumplimiento_porcentaje}% consumido</p>
                  </div>
                )}

                <div className="text-[11px] space-y-2 pt-4 border-t">
                  <p><span className="text-slate-400">Solicitante:</span> <span className="font-bold text-slate-700">{ticketSeleccionado.solicitante?.nombre_completo}</span></p>
                  <p><span className="text-slate-400">Vence:</span> <span className="font-bold text-red-600">
                    {ticketSeleccionado.fecha_vencimiento_sla ? new Date(ticketSeleccionado.fecha_vencimiento_sla).toLocaleString() : 'Pendiente'}
                  </span></p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t bg-white">
              <form onSubmit={enviarComentario} className="flex gap-2">
                <input value={nuevoComentario} onChange={e => setNuevoComentario(e.target.value)} placeholder="Responder..." className="flex-1 border rounded px-3 py-2 text-sm outline-none focus:border-blue-500" disabled={['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus)} />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold disabled:opacity-50" disabled={['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus)}>Enviar</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVO TICKET */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Crear Nueva Solicitud</h2>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={manejarCreacionTicket} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Título</label>
                <input required value={formTicket.titulo} onChange={e => setFormTicket({...formTicket, titulo: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Resumen del problema..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Prioridad</label>
                  <select value={formTicket.prioridad} onChange={e => setFormTicket({...formTicket, prioridad: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
                    {slaConfigs.map(config => (
                      <option key={config.id} value={config.prioridad}>{config.prioridad} ({config.horas}h)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Equipo</label>
                  <select required value={formTicket.activo_id} onChange={e => setFormTicket({...formTicket, activo_id: e.target.value})} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">-- Seleccionar --</option>
                    {activosUsuario.map(a => <option key={a.id} value={a.id}>{a.nombre} - {a.serie}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Descripción</label>
                <textarea required value={formTicket.descripcion} onChange={e => setFormTicket({...formTicket, descripcion: e.target.value})} className="w-full border rounded px-3 py-2 text-sm h-32" placeholder="Describe a detalle lo ocurrido..."></textarea>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 transition">Enviar Solicitud</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default MesaAyuda;