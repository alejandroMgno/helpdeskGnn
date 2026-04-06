// frontend/src/views/mesaAyuda.jsx
import React, { useState, useRef } from 'react';

const MesaAyuda = ({ user, token }) => {
  // MOCK DATA: Lista de tickets
  const [tickets, setTickets] = useState([
    { id: 'TK-1042', titulo: 'Servidor ERP Caído', solicitante: 'María López', departamento: 'Soporte N3', estatus: 'Abierto', prioridad: 'Crítica 2h', horas_restantes: 1.5, fecha: '06 Abr 2026', activo_relacionado: 'SRV-001' },
    { id: 'TK-1045', titulo: 'No puedo imprimir', solicitante: 'Juan Pérez', departamento: 'Soporte N1', estatus: 'En Progreso', prioridad: 'Alta 8h', horas_restantes: 4.2, fecha: '06 Abr 2026', activo_relacionado: 'IMP-045' },
    { id: 'TK-1050', titulo: 'Solicitud de nuevo Mouse', solicitante: 'Ana Gómez', departamento: 'Soporte N1', estatus: 'Resuelto', prioridad: 'Baja 72h', horas_restantes: 48.0, fecha: '05 Abr 2026', activo_relacionado: 'PER-012' },
  ]);

  // MOCK DATA: Comentarios (El primero ya trae una imagen de ejemplo simulada)
  const [comentarios, setComentarios] = useState([
    { id: 1, ticket_id: 'TK-1042', autor: 'María López', rol: 'Normal', texto: 'El sistema ERP marca error 500 al intentar hacer una factura. Adjunto la captura de pantalla del error exacto.', fecha: '06 Abr, 09:00 AM', avatar: 'https://ui-avatars.com/api/?name=Maria+Lopez&background=0f172a&color=fff', adjunto_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', adjunto_nombre: 'error_500.png' },
    { id: 2, ticket_id: 'TK-1042', autor: 'Sistema', rol: 'Bot', texto: 'Ticket escalado automáticamente a Soporte N3.', fecha: '06 Abr, 09:05 AM', avatar: '', adjunto_url: null, adjunto_nombre: null },
  ]);

  // MOCK DATA: Activos
  const activosUsuario = [
    { id: 'LT-DELL-042', descripcion: 'Dell Latitude 5420 (Laptop)' },
    { id: 'CEL-IPH-012', descripcion: 'iPhone 13 (Celular corporativo)' },
    { id: 'PR-HP-005', descripcion: 'HP LaserJet Pro (Impresora asignada)' }
  ];

  // Referencias para los inputs de archivos ocultos
  const fileInputChatRef = useRef(null);
  const fileInputTicketRef = useRef(null);

  // Estados de Interfaz
  const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("all");

  // Estados para Archivos Adjuntos
  const [archivoChat, setArchivoChat] = useState(null);
  const [archivoNuevoTicket, setArchivoNuevoTicket] = useState(null);

  // Estados para NUEVO TICKET
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [formTicket, setFormTicket] = useState({
    titulo: '',
    departamento: 'Soporte N1',
    prioridad: 'Media 24h',
    activo_relacionado: '',
    descripcion: ''
  });

  // Filtro de la tabla
  const ticketsFiltrados = tickets.filter(t => {
    if (filtroEstatus === "all") return true;
    if (filtroEstatus === "abiertos") return ['Abierto', 'En Progreso'].includes(t.estatus);
    if (filtroEstatus === "resueltos") return t.estatus === 'Resuelto';
    if (filtroEstatus === "cerrados") return t.estatus === 'Cerrado';
    return true;
  });

  const comentariosDelTicket = ticketSeleccionado
    ? comentarios.filter(c => c.ticket_id === ticketSeleccionado.id)
    : [];

  // Helpers de diseño
  const getEstatusBadge = (estatus) => {
    const styles = {
      'Abierto': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'En Progreso': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'Resuelto': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Cerrado': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      'Cancelado': 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return styles[estatus] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const getPrioridadColor = (prioridad) => {
    if (prioridad.includes('Crítica')) return 'text-red-500';
    if (prioridad.includes('Alta')) return 'text-orange-500';
    if (prioridad.includes('Media')) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Manejadores de Archivos
  const handleArchivoChat = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoChat(e.target.files[0]);
    }
  };

  const handleArchivoTicket = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoNuevoTicket(e.target.files[0]);
    }
  };

  // ACCIONES DE CHAT / TICKET
  const enviarComentario = (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim() && !archivoChat) return; // Permitimos enviar si solo hay archivo

    // Generar URL temporal si subió un archivo para que lo vea de inmediato
    let tempUrl = null;
    let fileName = null;
    if (archivoChat) {
      tempUrl = URL.createObjectURL(archivoChat);
      fileName = archivoChat.name;
    }

    const nuevoMsg = {
      id: Date.now(),
      ticket_id: ticketSeleccionado.id,
      autor: user?.nombre_completo || 'Usuario',
      rol: user?.rol || 'Normal',
      texto: nuevoComentario,
      fecha: 'Ahora mismo',
      avatar: user?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=0891b2&color=fff',
      adjunto_url: tempUrl,
      adjunto_nombre: fileName
    };

    setComentarios([...comentarios, nuevoMsg]);
    setNuevoComentario("");
    setArchivoChat(null);
    if (fileInputChatRef.current) fileInputChatRef.current.value = ""; // Reset input
  };

  const cambiarEstatus = (nuevoEstatus) => {
    setTickets(tickets.map(t => t.id === ticketSeleccionado.id ? { ...t, estatus: nuevoEstatus } : t));
    setTicketSeleccionado({ ...ticketSeleccionado, estatus: nuevoEstatus });

    setComentarios([...comentarios, {
      id: Date.now(),
      ticket_id: ticketSeleccionado.id,
      autor: 'Sistema',
      rol: 'Bot',
      texto: `${user?.nombre_completo || 'Usuario'} cambió el estatus a ${nuevoEstatus}.`,
      fecha: 'Ahora mismo',
      avatar: '',
      adjunto_url: null,
      adjunto_nombre: null
    }]);
  };

  // ACCIÓN DE CREAR NUEVO TICKET
  const manejarCreacionTicket = (e) => {
    e.preventDefault();

    if (!formTicket.titulo.trim() || !formTicket.descripcion.trim()) {
      alert("Por favor llena el título y la descripción.");
      return;
    }
    if (!formTicket.activo_relacionado) {
      alert("Es obligatorio seleccionar el activo que presenta la falla.");
      return;
    }

    const nuevoId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaActual = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    let tempUrl = null;
    let fileName = null;
    if (archivoNuevoTicket) {
      tempUrl = URL.createObjectURL(archivoNuevoTicket);
      fileName = archivoNuevoTicket.name;
    }

    const ticketCreado = {
      id: nuevoId,
      titulo: formTicket.titulo,
      solicitante: user?.nombre_completo || 'Usuario',
      departamento: formTicket.departamento,
      estatus: 'Abierto',
      prioridad: formTicket.prioridad,
      horas_restantes: formTicket.prioridad.includes('Crítica') ? 2 : formTicket.prioridad.includes('Alta') ? 8 : 24,
      fecha: fechaActual,
      activo_relacionado: formTicket.activo_relacionado
    };

    const primerComentario = {
      id: Date.now(),
      ticket_id: nuevoId,
      autor: user?.nombre_completo || 'Usuario',
      rol: user?.rol || 'Normal',
      texto: formTicket.descripcion,
      fecha: 'Ahora mismo',
      avatar: user?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=0891b2&color=fff',
      adjunto_url: tempUrl,
      adjunto_nombre: fileName
    };

    setTickets([ticketCreado, ...tickets]);
    setComentarios([...comentarios, primerComentario]);

    setFormTicket({ titulo: '', departamento: 'Soporte N1', prioridad: 'Media 24h', activo_relacionado: '', descripcion: '' });
    setArchivoNuevoTicket(null);
    if (fileInputTicketRef.current) fileInputTicketRef.current.value = "";
    setMostrarModalNuevo(false);
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {user?.rol === 'Admin' ? 'Todos los Tickets' : user?.rol === 'Tecnico' ? 'Mi Pila de Trabajo' : 'Mis Solicitudes'}
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {user?.rol !== 'Normal' ? 'Atiende los reportes priorizando por vencimiento de SLA.' : 'Da seguimiento a tus reportes de ayuda.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-cyan-500 cursor-pointer appearance-none"
          >
            <option value="all">Todos los Estatus</option>
            <option value="abiertos">Solo Abiertos / Progreso</option>
            <option value="resueltos">Resueltos</option>
            <option value="cerrados">Cerrados</option>
          </select>

          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-900/50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Nuevo Ticket
          </button>
        </div>
      </div>

      {/* LISTA DE TICKETS (TABLA) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-6">ID Ticket</th>
                <th className="p-4">Asunto / Solicitante</th>
                <th className="p-4">Prioridad / SLA</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-right pr-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {ticketsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500 font-bold">
                    No hay tickets que coincidan con el filtro actual.
                  </td>
                </tr>
              ) : (
                ticketsFiltrados.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 pl-6 font-bold text-cyan-500">{ticket.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-white mb-0.5 truncate max-w-[250px]">{ticket.titulo}</p>
                      <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        {ticket.solicitante} <span className="mx-1">•</span> {ticket.departamento}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className={`text-xs font-black uppercase tracking-wider mb-0.5 ${getPrioridadColor(ticket.prioridad)}`}>
                        {ticket.prioridad}
                      </p>
                      <p className="text-xs font-medium text-slate-400">
                        Vence en: <span className={ticket.horas_restantes < 2 ? 'text-red-400 font-bold' : ''}>{ticket.horas_restantes}h</span>
                      </p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase ${getEstatusBadge(ticket.estatus)}`}>
                        {ticket.estatus}
                      </span>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <button
                        onClick={() => setTicketSeleccionado(ticket)}
                        className="text-slate-400 hover:text-cyan-400 transition font-bold text-xs uppercase tracking-wider bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded"
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL / PANEL LATERAL DE CREAR TICKET     */}
      {/* ========================================= */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">

            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">Levantar Nuevo Ticket</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mesa de Ayuda</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalNuevo(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="form-nuevo-ticket" onSubmit={manejarCreacionTicket} className="space-y-6">

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Asunto / Problema Breve *</label>
                  <input
                    type="text"
                    required
                    value={formTicket.titulo}
                    onChange={(e) => setFormTicket({ ...formTicket, titulo: e.target.value })}
                    placeholder="Ej. Mi computadora no enciende..."
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Escalar a *</label>
                    <select
                      value={formTicket.departamento}
                      onChange={(e) => setFormTicket({ ...formTicket, departamento: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
                    >
                      <option value="Soporte N1">Soporte N1 (Mesa de Ayuda)</option>
                      <option value="Soporte N2">Soporte N2 (Técnico Especializado)</option>
                      <option value="Soporte N3">Soporte N3 (Infraestructura / Redes)</option>
                    </select>
                  </div>

                  {['Admin', 'Tecnico'].includes(user?.rol) ? (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Prioridad SLA</label>
                      <select
                        value={formTicket.prioridad}
                        onChange={(e) => setFormTicket({ ...formTicket, prioridad: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
                      >
                        <option value="Baja 72h">🟢 Baja (72h)</option>
                        <option value="Media 24h">🟡 Media (24h)</option>
                        <option value="Alta 8h">🟠 Alta (8h)</option>
                        <option value="Crítica 2h">🔴 Crítica (2h)</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex justify-between">
                        <span>Prioridad Asignada</span>
                      </label>
                      <div className="w-full bg-slate-900 border border-slate-800 text-slate-400 text-sm font-bold rounded-xl px-4 py-3 cursor-not-allowed">
                        🟡 Media (Por Defecto)
                      </div>
                    </div>
                  )}
                </div>

                {/* DROPDOWN DE ACTIVO OBLIGATORIO */}
                <div className="p-4 bg-cyan-900/10 border border-cyan-500/20 rounded-xl">
                  <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
                    Activo Relacionado al Problema *
                  </label>
                  <select
                    required
                    value={formTicket.activo_relacionado}
                    onChange={(e) => setFormTicket({ ...formTicket, activo_relacionado: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
                  >
                    <option value="" disabled>-- Selecciona un activo asignado a ti --</option>
                    {activosUsuario.map(activo => (
                      <option key={activo.id} value={activo.id}>
                        {activo.descripcion} (SN: {activo.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Descripción Detallada *
                  </label>
                  <textarea
                    required
                    value={formTicket.descripcion}
                    onChange={(e) => setFormTicket({ ...formTicket, descripcion: e.target.value })}
                    placeholder="Explica qué estaba pasando antes de la falla, qué errores ves en pantalla, etc..."
                    className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-4 outline-none focus:border-cyan-500 transition-colors h-32 resize-none custom-scrollbar"
                  ></textarea>
                </div>

                {/* ZONA DE ADJUNTOS TICKET */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                    Evidencia (Opcional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputTicketRef}
                    onChange={handleArchivoTicket}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />

                  {!archivoNuevoTicket ? (
                    <div
                      onClick={() => fileInputTicketRef.current.click()}
                      className="w-full border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition group"
                    >
                      <svg className="w-8 h-8 text-slate-500 group-hover:text-cyan-400 transition mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      <p className="text-sm text-slate-400 font-bold">Haz clic aquí para subir una imagen o captura de pantalla</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF hasta 10MB</p>
                    </div>
                  ) : (
                    <div className="w-full bg-cyan-900/20 border border-cyan-500/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-cyan-900 p-2 rounded text-cyan-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{archivoNuevoTicket.name}</p>
                          <p className="text-xs text-cyan-500">Archivo listo para enviar</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setArchivoNuevoTicket(null); if (fileInputTicketRef.current) fileInputTicketRef.current.value = ""; }}
                        className="text-slate-400 hover:text-red-400 p-2 transition"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  )}
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setMostrarModalNuevo(false)}
                className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                form="form-nuevo-ticket"
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-900/50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                Enviar Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL / PANEL LATERAL DE DETALLE (CHAT)   */}
      {/* ========================================= */}
      {ticketSeleccionado && !mostrarModalNuevo && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[800px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">

            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <span className="text-cyan-500">{ticketSeleccionado.id}</span>
                  <span className="text-slate-600">/</span>
                  <span className="truncate max-w-[300px] block">{ticketSeleccionado.titulo}</span>
                </h2>
              </div>
              <button onClick={() => setTicketSeleccionado(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden flex-col md:flex-row">

              {/* IZQUIERDA: Hilo de conversación */}
              <div className="flex-1 flex flex-col border-r border-slate-800">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/30">
                  {comentariosDelTicket.length === 0 ? (
                    <div className="text-center text-slate-500 font-bold mt-10">No hay comentarios aún.</div>
                  ) : (
                    comentariosDelTicket.map((msg) => (
                      <div key={msg.id} className={`flex gap-4 ${msg.rol === 'Bot' ? 'justify-center' : ''}`}>
                        {msg.rol === 'Bot' ? (
                          <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50 text-xs font-medium text-slate-400 text-center w-full max-w-md flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {msg.texto}
                          </div>
                        ) : (
                          <>
                            <img src={msg.avatar} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-800 mt-1 flex-shrink-0" />
                            <div className={`flex-1 bg-slate-800/80 border border-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-sm relative min-w-0`}>
                              <div className="flex justify-between items-start mb-2">
                                <div className="min-w-0 flex-1">
                                  <span className="font-bold text-sm text-white truncate">{msg.autor}</span>
                                  <span className="text-[10px] font-black uppercase tracking-widest ml-2 text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">{msg.rol}</span>
                                </div>
                                <span className="text-xs font-medium text-slate-500 flex-shrink-0 ml-2">{msg.fecha}</span>
                              </div>
                              {msg.texto && <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{msg.texto}</p>}

                              {/* RENDERIZADO DEL ARCHIVO ADJUNTO */}
                              {msg.adjunto_url && (
                                <div className="mt-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 inline-block max-w-full">
                                  {msg.adjunto_nombre?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || msg.adjunto_url.startsWith('blob:') || msg.adjunto_url.includes('images.unsplash') ? (
                                    <img src={msg.adjunto_url} alt="Adjunto" className="max-w-full h-auto max-h-[300px] object-contain block" />
                                  ) : (
                                    <div className="flex items-center gap-3 p-3">
                                      <div className="bg-slate-800 p-2 rounded text-cyan-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-white">{msg.adjunto_nombre || 'Archivo Adjunto'}</p>
                                        <a href={msg.adjunto_url} target="_blank" rel="noreferrer" className="text-xs text-cyan-500 hover:underline">Descargar archivo</a>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Input para nuevo comentario */}
                <div className="p-4 border-t border-slate-800 bg-slate-900">
                  <form onSubmit={enviarComentario} className="relative">

                    {/* PREVIEW DEL ARCHIVO ANTES DE ENVIAR (EN EL CHAT) */}
                    {archivoChat && (
                      <div className="absolute -top-12 left-0 bg-slate-800 border border-slate-700 rounded-t-lg px-3 py-1.5 flex items-center gap-2 shadow-lg">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        <span className="text-xs font-bold text-slate-300 truncate max-w-[200px]">{archivoChat.name}</span>
                        <button type="button" onClick={() => { setArchivoChat(null); if (fileInputChatRef.current) fileInputChatRef.current.value = ""; }} className="ml-2 text-slate-500 hover:text-red-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    )}

                    <textarea
                      value={nuevoComentario}
                      onChange={(e) => setNuevoComentario(e.target.value)}
                      placeholder={['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus) ? "El ticket está cerrado." : "Escribe una actualización o respuesta al usuario..."}
                      disabled={['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus)}
                      className={`w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm pl-4 pr-32 py-3 outline-none focus:border-cyan-500 resize-none h-24 custom-scrollbar disabled:opacity-50 ${archivoChat ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'}`}
                    ></textarea>

                    {/* INPUT FILE OCULTO PARA EL CHAT */}
                    <input
                      type="file"
                      ref={fileInputChatRef}
                      onChange={handleArchivoChat}
                      className="hidden"
                    />

                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputChatRef.current.click()}
                        disabled={['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus)}
                        className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition"
                        title="Adjuntar Imagen/Archivo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                      </button>
                      <button
                        type="submit"
                        disabled={['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus) || (!nuevoComentario.trim() && !archivoChat)}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
                      >
                        Enviar
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* DERECHA: Metadata y Acciones del Ticket */}
              <div className="w-full md:w-64 bg-slate-900 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Estatus del Ticket</label>
                  {['Admin', 'Tecnico'].includes(user?.rol) ? (
                    <select
                      value={ticketSeleccionado.estatus}
                      onChange={(e) => cambiarEstatus(e.target.value)}
                      disabled={['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus)}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500 cursor-pointer disabled:opacity-50 appearance-none"
                    >
                      <option value="Abierto">Abierto</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Resuelto">Resuelto</option>
                      <option value="Cerrado">Cerrado Oficialmente</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1.5 rounded inline-block w-full text-center text-xs font-black tracking-widest border uppercase ${getEstatusBadge(ticketSeleccionado.estatus)}`}>
                      {ticketSeleccionado.estatus}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {['Admin', 'Tecnico'].includes(user?.rol) && !['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus) && (
                    <button
                      onClick={() => cambiarEstatus('Cerrado')}
                      className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      Finalizar y Cerrar
                    </button>
                  )}

                  {!['Admin', 'Tecnico'].includes(user?.rol) && !['Cerrado', 'Cancelado'].includes(ticketSeleccionado.estatus) && (
                    <button
                      onClick={() => cambiarEstatus('Cancelado')}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Cancelar Ticket
                    </button>
                  )}
                </div>

                <hr className="border-slate-800" />

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Solicitante</label>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    {ticketSeleccionado.solicitante}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{ticketSeleccionado.departamento}</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nivel SLA</label>
                  <p className={`text-sm font-black uppercase tracking-wider ${getPrioridadColor(ticketSeleccionado.prioridad)}`}>
                    {ticketSeleccionado.prioridad}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Vence: {ticketSeleccionado.horas_restantes} h</p>
                </div>

                {ticketSeleccionado.activo_relacionado && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Activo Involucrado</label>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 p-2 rounded-lg">
                      <span className="text-xs font-bold text-cyan-400">{ticketSeleccionado.activo_relacionado}</span>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animación CSS para los modales */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
};

export default MesaAyuda;