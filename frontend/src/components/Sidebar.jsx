// frontend/src/components/Sidebar.jsx
import React, { useState } from 'react';
import clienteAxios from '../api/axios';

const Sidebar = ({ user, setUser, vistaActual, setVista, handleLogout }) => {
  const [cambiandoStatus, setCambiandoStatus] = useState(false);

  const cambiarStatus = async (e) => {
    const nuevoStatus = e.target.value;
    const statusAnterior = user.status_tecnico;

    setCambiandoStatus(true);
    setUser({ ...user, status_tecnico: nuevoStatus });

    try {
      await clienteAxios.put(`/usuarios/${user.id}`, {
        ...user,
        status_tecnico: nuevoStatus
      });
    } catch (error) {
      console.error("Error al actualizar disponibilidad:", error);
      setUser({ ...user, status_tecnico: statusAnterior });
      alert("No se pudo actualizar tu estado de disponibilidad en el servidor.");
    } finally {
      setCambiandoStatus(false);
    }
  };

  const navItem = (id, label, svgPath, allowedRoles = ['Admin', 'Tecnico', 'Usuario', 'Normal']) => {
    if (!user?.rol || !allowedRoles.includes(user.rol)) return null;
    const isActive = vistaActual === id;

    return (
      <button
        onClick={() => setVista(id)}
        className={`w-full flex items-center gap-3 px-5 py-3 mb-0.5 transition-colors font-medium text-sm border-l-4 ${isActive
            ? 'bg-slate-800 border-blue-500 text-white'
            : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
          }`}
      >
        <svg className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={svgPath}></path>
        </svg>
        {label}
      </button>
    );
  };

  return (
    // CONTENEDOR: Fondo Pizarra Oscuro Corporativo (Slate 900)
    <aside className="w-64 bg-slate-900 flex flex-col h-screen shadow-xl relative z-20 shrink-0">

      {/* LOGOTIPO CORPORATIVO (Alineado con el h-14 del Topbar de App.jsx) */}
      <div className="h-14 px-6 border-b border-slate-800 flex items-center bg-slate-950/30">
        <div className="flex items-center gap-2.5">
          {/* Logo con acento naranja estilo iTop */}
          <div className="w-6 h-6 rounded flex items-center justify-center bg-orange-500 shadow-sm">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            GNN<span className="font-normal text-slate-400">Desk</span>
          </h1>
        </div>
      </div>

      {/* SLA STATUS DROPDOWN (Solo para técnicos/admins) */}
      {['Admin', 'Tecnico'].includes(user?.rol) && (
        <div className="px-5 py-5 border-b border-slate-800">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>Disponibilidad</span>
            {cambiandoStatus && <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></span>}
          </label>
          <div className="relative">
            <select
              value={user.status_tecnico || "Activo"}
              onChange={cambiarStatus}
              disabled={cambiandoStatus}
              className={`w-full bg-slate-800 border ${cambiandoStatus ? 'border-slate-700 text-slate-500' : 'border-slate-700 hover:border-slate-600 text-slate-200'} text-sm font-medium rounded px-3 py-2 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer transition-colors shadow-sm`}
            >
              <option value="Activo">🟢 Activo / En línea</option>
              <option value="Ocupado">🔴 Ocupado</option>
              <option value="Comiendo">🍔 Comida</option>
              <option value="Fuera_de_Oficina">🚗 Fuera de Oficina</option>
              <option value="Vacaciones">🏖️ Vacaciones</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItem('dashboard', 'Dashboard Global', 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6')}
        {navItem('tickets', 'Mesa de Ayuda', 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z')}
        {navItem('conocimiento', 'Base de Saber', 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253')}
        {navItem('inventario', 'Inventario (ITAM)', 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z')}
        {navItem('licencias', 'Licencias (SAM)', 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', ['Admin', 'Tecnico'])}
        {navItem('usuarios', 'Directorio', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', ['Admin'])}
        {navItem('reportes', 'Reportes', 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', ['Admin'])}
        {navItem('configuracion', 'Configuración', 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', ['Admin'])}
      </div>

      {/* FOOTER / LOGOUT */}
      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded transition-colors font-medium text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Cerrar Sesión
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;