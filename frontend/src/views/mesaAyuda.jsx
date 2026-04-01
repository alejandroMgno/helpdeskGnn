import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/api/v1';

const MesaAyuda = ({ token }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/tickets/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 text-white">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Mesa de Ayuda</h1>
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestión de Soporte y SLA</p>
        </div>
        <button className="bg-cyan-500 hover:bg-cyan-400 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
          + Levantar Ticket
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard label="Abiertos" count="5" color="text-white" />
        <StatusCard label="En Proceso" count="2" color="text-cyan-400" />
        <StatusCard label="Urgentes" count="1" color="text-red-500" />
        <StatusCard label="Cerrados" count="45" color="text-slate-500" />
      </div>

      <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-10 text-center">
        <p className="text-white/20 font-black uppercase tracking-[0.3em]">Lista de tickets en desarrollo</p>
      </div>
    </div>
  );
};

const StatusCard = ({ label, count, color }) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
    <h4 className={`text-3xl font-black mt-1 ${color}`}>{count}</h4>
  </div>
);

export default MesaAyuda;