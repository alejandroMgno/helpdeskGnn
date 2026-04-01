import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000/api/v1';

const Usuarios = ({ token }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/usuarios/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 text-white">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">Gestión de Usuarios</h1>
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-1">Administración de Accesos GNN</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20">
          + Nuevo Usuario
        </button>
      </header>

      <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-white/5 text-slate-500 uppercase font-black">
            <tr>
              <th className="p-5">Nombre</th>
              <th className="p-5">Correo Electrónico</th>
              <th className="p-5">Rol</th>
              <th className="p-5">Departamento</th>
              <th className="p-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="5" className="p-20 text-center text-white/20 font-bold uppercase">Sincronizando Usuarios...</td></tr>
            ) : usuarios.length > 0 ? (
              usuarios.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-5 font-bold uppercase">{u.nombre}</td>
                  <td className="p-5 text-white/50">{u.email}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                      u.rol === 'admin' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-700/30 text-slate-400'
                    }`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="p-5 text-white/50 uppercase">{u.departamento || 'General'}</td>
                  <td className="p-5 text-right">
                    <button className="text-white/20 hover:text-white font-black transition-colors mr-4">EDITAR</button>
                    <button className="text-red-500/30 hover:text-red-500 font-black transition-colors">ELIMINAR</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="p-20 text-center text-white/20 font-bold uppercase">No hay usuarios registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Usuarios;