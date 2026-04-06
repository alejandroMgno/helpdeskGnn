import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/api/v1';

const MesaAyuda = ({ token, user }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para modales
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [ticketActivo, setTicketActivo] = useState(null); // Ticket seleccionado para el chat
  const [nuevoTicket, setNuevoTicket] = useState({ titulo: '', descripcion: '', prioridad: 'media' });
  const [nuevoComentario, setNuevoComentario] = useState("");

  useEffect(() => { fetchTickets(); }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/tickets/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if(res.ok) setTickets(await res.json());
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const abrirTicket = async (id) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if(res.ok) setTicketActivo(await res.json());
    } catch (err) { alert("Error al abrir ticket"); }
  };

  const enviarComentario = async (e) => {
    e.preventDefault();
    if(!nuevoComentario.trim()) return;
    try {
      await fetch(`${API_URL}/tickets/${ticketActivo.ticket.id}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ texto: nuevoComentario })
      });
      setNuevoComentario("");
      abrirTicket(ticketActivo.ticket.id); // Recargar chat
    } catch (err) { console.error(err); }
  };

  const cambiarStatus = async (nuevoStatus) => {
    try {
      const res = await fetch(`${API_URL}/tickets/${ticketActivo.ticket.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: nuevoStatus })
      });
      if(res.ok) {
        alert(`Ticket marcado como ${nuevoStatus}`);
        abrirTicket(ticketActivo.ticket.id);
        fetchTickets();
      } else {
        const error = await res.json();
        alert(error.detail);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 text-white relative flex gap-6">
      {/* COLUMNA IZQUIERDA: LISTA DE TICKETS */}
      <div className={`flex-1 space-y-8 ${ticketActivo ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Mesa de Ayuda</h1>
            <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-1">Soporte GNN</p>
          </div>
          <button onClick={() => setShowNuevoModal(true)} className="bg-cyan-500 hover:bg-cyan-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
            + Levantar Ticket
          </button>
        </header>

        <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-white/5 text-slate-500 uppercase font-black">
              <tr>
                <th className="p-5">ID</th>
                <th className="p-5">Asunto</th>
                <th className="p-5">Estado</th>
                <th className="p-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <tr><td colSpan="4" className="p-10 text-center">Cargando...</td></tr> : 
                tickets.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors cursor-pointer" onClick={() => abrirTicket(t.id)}>
                    <td className="p-5 text-white/50 font-black">#{t.id}</td>
                    <td className="p-5 font-bold uppercase">{t.titulo}</td>
                    <td className="p-5 font-black text-cyan-400 uppercase">{t.status}</td>
                    <td className="p-5 text-right"><span className="text-white/30 hover:text-white font-black">VER</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* COLUMNA DERECHA: DETALLE DEL TICKET (CHAT) */}
      {ticketActivo && (
        <div className="w-full lg:w-1/2 bg-slate-900/90 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 flex flex-col h-[80vh] sticky top-6 shadow-2xl animate-in slide-in-from-right-8">
          {/* Header del Ticket */}
          <div className="p-6 border-b border-white/10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">{ticketActivo.ticket.status}</span>
                <span className="text-white/40 text-[9px] font-black uppercase">Prioridad: {ticketActivo.ticket.prioridad}</span>
              </div>
              <h2 className="text-2xl font-black uppercase">{ticketActivo.ticket.titulo}</h2>
              <p className="text-white/50 text-xs mt-1">Creado por: {ticketActivo.creador} • Asignado a: {ticketActivo.tecnico}</p>
            </div>
            <button onClick={() => setTicketActivo(null)} className="text-white/30 hover:text-white text-xl">✕</button>
          </div>

          {/* Área de Chat / Comentarios */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Descripción original */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Descripción del Problema</p>
              <p className="text-sm text-white/80">{ticketActivo.ticket.descripcion}</p>
            </div>

            {/* Comentarios */}
            {ticketActivo.comentarios.map(c => (
              <div key={c.id} className={`flex flex-col ${c.autor === user.id ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl ${c.autor === user.id ? 'bg-cyan-600/30 border border-cyan-500/30' : 'bg-white/10 border border-white/10'}`}>
                  <p className="text-sm">{c.texto}</p>
                </div>
                <span className="text-[8px] text-white/30 font-bold uppercase mt-1">Usuario ID: {c.autor}</span>
              </div>
            ))}
          </div>

          {/* Área de Acciones y Envío */}
          <div className="p-6 border-t border-white/10 bg-black/20">
            {/* Botones de Estatus (Depende del Rol) */}
            <div className="flex gap-2 mb-4">
              {(user.rol === 'tecnico' || user.rol === 'admin') && ticketActivo.ticket.status !== 'cerrado' && (
                <button onClick={() => cambiarStatus('cerrado')} className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all">
                  ✔ Cerrar Ticket
                </button>
              )}
              {(user.rol === 'normal' || user.rol === 'admin') && ticketActivo.ticket.status !== 'cancelado' && (
                <button onClick={() => cambiarStatus('cancelado')} className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all">
                  ✖ Cancelar Ticket
                </button>
              )}
            </div>

            <form onSubmit={enviarComentario} className="flex gap-3">
              <input 
                type="text" value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)}
                placeholder="Escribe un comentario o actualización..."
                className="flex-1 bg-white/5 border border-white/10 p-3 rounded-xl text-xs text-white outline-none focus:border-cyan-500/50"
              />
              <button type="submit" className="bg-cyan-500 hover:bg-cyan-400 px-6 rounded-xl font-black text-[10px] uppercase transition-all shadow-lg shadow-cyan-500/20">
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* ... (Aquí va tu Modal de Nuevo Ticket que ya tenías) ... */}
    </div>
  );
};

export default MesaAyuda;