import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:8000/api/v1';

const Inventario = ({ token }) => {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchActivos();
  }, []);

  const fetchActivos = async () => {
    try {
      const res = await fetch(`${API_URL}/activos/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setActivos(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSubiendo(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/activos/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        alert("¡Inventario GNN actualizado correctamente!");
        fetchActivos();
      } else {
        alert("Error en el formato del archivo");
      }
    } catch (err) { alert("Error de conexión"); }
    finally { setSubiendo(false); }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Inventario ITAM</h1>
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-1">Control Total de Equipos</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.csv" onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current.click()}
            disabled={subiendo}
            className="bg-white/10 hover:bg-white/20 text-white font-black text-[9px] px-6 py-3 rounded-xl border border-white/10 uppercase tracking-widest transition-all"
          >
            {subiendo ? 'PROCESANDO...' : '↑ Carga Masiva'}
          </button>
          <button className="bg-cyan-500 hover:bg-cyan-400 text-white font-black text-[9px] px-6 py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 uppercase tracking-widest">
            + Nuevo Equipo
          </button>
        </div>
      </header>

      <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-white/5 text-slate-500 uppercase font-black">
            <tr>
              <th className="p-5">Etiqueta</th>
              <th className="p-5">Equipo</th>
              <th className="p-5">Categoría</th>
              <th className="p-5">Estado</th>
              <th className="p-5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center text-white/20 font-bold uppercase">Sincronizando...</td></tr>
            ) : activos.length > 0 ? (
              activos.map(a => (
                <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-5 font-black text-cyan-400">{a.etiqueta_gnn}</td>
                  <td className="p-5"><p className="font-bold uppercase">{a.nombre}</p><p className="text-[9px] text-white/30">{a.serie}</p></td>
                  <td className="p-5 text-white/50 uppercase">{a.categoria}</td>
                  <td className="p-5">
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-[9px] font-black uppercase">{a.status}</span>
                  </td>
                  <td className="p-5 text-right"><button className="text-white/20 hover:text-white font-black transition-colors">VER</button></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-20 text-center text-white/20 font-bold uppercase">No hay equipos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventario;