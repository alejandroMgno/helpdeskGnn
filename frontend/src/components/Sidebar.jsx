// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import clienteAxios from '../api/axios'; // <-- 1. Importamos nuestro puente de conexión

const Sidebar = ({ user, setUser, vistaActual, setVista, handleLogout }) => {
  const [cambiandoStatus, setCambiandoStatus] = useState(false);

  // ==========================================
  // CONEXIÓN CON EL BACKEND (Actualizar Estatus)
  // ==========================================
  const cambiarStatus = async (e) => {
    const nuevoStatus = e.target.value;
    const statusAnterior = user.estado_disponibilidad; // Guardamos el estado previo por si hay error

    setCambiandoStatus(true);

    // 1. Actualización Optimista: Cambiamos la UI de inmediato para que se sienta súper rápido
    setUser({ ...user, estado_disponibilidad: nuevoStatus });

    try {
      // 2. Le avisamos a la Base de Datos (Ajusta la URL según tu ruta en FastAPI)
      // Asumiendo que tu ruta de actualización es algo como PUT /usuarios/{id}
      await clienteAxios.put(`/usuarios/${user.id}`, {
        ...user,
        estado_disponibilidad: nuevoStatus
      });

    } catch (error) {
      console.error("Error al actualizar disponibilidad:", error);
      // 3. Si el servidor falla, revertimos el cambio visualmente y avisamos
      setUser({ ...user, estado_disponibilidad: statusAnterior });
      alert("No se pudo actualizar tu estado de disponibilidad en el servidor.");
    } finally {
      setCambiandoStatus(false);
    }
  };

  const navItem = (id, label, svgPath, allowedRoles = ['Admin', 'Tecnico', 'Usuario', 'Normal']) => {
    // IMPORTANTE: Comparamos el rol del usuario contra la lista permitida
    if (!user?.rol || !allowedRoles.includes(user.rol)) return null;

    const isActive = vistaActual === id;

    return (
      <button
        onClick={() => setVista(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 mb-1 rounded-lg transition-all duration-200 font-bold text-xs uppercase tracking-widest ${isActive
          ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent'
          }`}
      >
        <svg
          className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={svgPath}></path>
        </svg>
        {label}
      </button>
    );
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shadow-2xl relative z-20">
      <div className="p-6 border-b border-slate-800 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">Z</span>
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase">
            Zenit<span className="text-cyan-500">Desk</span>
          </h1>
        </div>
      </div>

      {/* Control de disponibilidad solo para Staff */}
      {['Admin', 'Tecnico'].includes(user?.rol) && (
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex justify-between items-center">
            <span>Mi Disponibilidad (SLA)</span>
            {cambiandoStatus && <span className="w-2 h-2 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></span>}
          </label>
          <div className="relative">
            <select
              value={user.estado_disponibilidad || "Activo"}
              onChange={cambiarStatus}
              disabled={cambiandoStatus}
              className={`w-full bg-slate-800 border ${cambiandoStatus ? 'border-slate-600 text-slate-500' : 'border-slate-700 text-white'} text-xs font-bold rounded-lg px-3 py-2 outline-none focus:border-cyan-500 appearance-none cursor-pointer transition-colors`}
            >
              <option value="Activo">🟢 Activo</option>
              <option value="Ocupado">🔴 Ocupado</option>
              <option value="Comiendo">🍔 Comiendo</option>
              <option value="Fuera de Oficina">🚗 Fuera de Oficina</option>
              <option value="Vacaciones">🏖️ Vacaciones</option>
            </select>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {/* Dashboard visible para todos */}
        {navItem('dashboard', 'Dashboard', 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6')}

        {/* Mesa de Ayuda visible para todos */}
        {navItem('tickets', 'Mesa de Ayuda', 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z')}

        {/* Saber visible para todos */}
        {navItem('conocimiento', 'Base de Saber', 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253')}

        {/* Inventario visible para todos */}
        {navItem('inventario', 'Mis Activos', 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z')}

        {/* Solo Staff */}
        {navItem('licencias', 'Licencias / SAM', 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', ['Admin', 'Tecnico'])}

        {/* Solo Admin */}
        {navItem('usuarios', 'Directorio', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', ['Admin'])}
        {navItem('reportes', 'Reportes', 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', ['Admin'])}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors font-bold text-xs uppercase tracking-widest">
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;