// frontend/src/views/usuarios.jsx
import React, { useState } from 'react';

const Usuarios = ({ user, token }) => {
  // --- MOCK DATA: Técnicos Disponibles (SLA) ---
  const tecnicosDisponibles = ['Roberto Torres', 'Ana Gómez', 'Luis Martínez', 'Sara Vega'];

  // --- MOCK DATA: Directorio de Usuarios ---
  const [usuarios, setUsuarios] = useState([
    { id: 1, nombre_completo: 'María López', email: 'mlopez@rubiofilms.com', zona: 'Corporativo', departamento: 'Contabilidad', centro_costo: 'CC-CON-002', rol: 'Usuario', estatus: 'Activo', fecha_ingreso: '2023-02-15', tecnico_base: 'Ana Gómez', tecnico_secundario: 'Roberto Torres' },
    { id: 2, nombre_completo: 'Juan Pérez', email: 'jperez@rubiofilms.com', zona: 'Zona Norte', departamento: 'Ventas', centro_costo: 'CC-VTA-NTE', rol: 'Usuario', estatus: 'Activo', fecha_ingreso: '2024-05-10', tecnico_base: 'Luis Martínez', tecnico_secundario: 'Sara Vega' },
    { id: 3, nombre_completo: 'Carlos Ruiz', email: 'cruiz@rubiofilms.com', zona: 'Corporativo', departamento: 'Sistemas', centro_costo: 'CC-SIS-004', rol: 'Tecnico', estatus: 'Activo', fecha_ingreso: '2022-11-01', tecnico_base: 'Roberto Torres', tecnico_secundario: 'Luis Martínez' },
    { id: 4, nombre_completo: 'Alejandro Rubio', email: 'arubio@rubiofilms.com', zona: 'Corporativo', departamento: 'Dirección', centro_costo: 'CC-DIR-001', rol: 'Admin', estatus: 'Activo', fecha_ingreso: '2020-01-10', tecnico_base: 'Ana Gómez', tecnico_secundario: 'Sara Vega' },
    { id: 5, nombre_completo: 'Ana Gómez', email: 'agomez@rubiofilms.com', zona: 'Corporativo', departamento: 'Recursos Humanos', centro_costo: 'CC-RH-003', rol: 'Usuario', estatus: 'Inactivo', fecha_ingreso: '2023-08-20', tecnico_base: 'Roberto Torres', tecnico_secundario: 'Luis Martínez' },
  ]);

  // --- ESTADO DINÁMICO: Catálogo Jerárquico (Zona -> Departamento -> C.C.) ---
  const [estructuraOrganizacional, setEstructuraOrganizacional] = useState({
    'Corporativo': {
      'Dirección': 'CC-DIR-001',
      'Contabilidad': 'CC-CON-002',
      'Recursos Humanos': 'CC-RH-003',
      'Sistemas': 'CC-SIS-004'
    },
    'Zona Norte': {
      'Ventas': 'CC-VTA-NTE',
      'Operaciones': 'CC-OPE-NTE',
      'Sistemas': 'CC-SIS-NTE'
    },
    'Zona Sur': {
      'Ventas': 'CC-VTA-SUR',
      'Operaciones': 'CC-OPE-SUR'
    }
  });

  const zonasDisponibles = Object.keys(estructuraOrganizacional);

  // Estados de UI
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalCatalogos, setMostrarModalCatalogos] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null); // NUEVO: Para ver detalles

  // Estados para Gestor de Catálogos (Ajustes)
  const [zonaSeleccionadaAjustes, setZonaSeleccionadaAjustes] = useState('Corporativo');
  const [nuevaZona, setNuevaZona] = useState('');
  const [nuevoDepto, setNuevoDepto] = useState({ nombre: '', centro_costo: '' });

  // Estados de Formularios de Usuarios (Actualizados con SLA)
  const formInicial = { nombre_completo: '', email: '', zona: '', departamento: '', centro_costo: '', rol: 'Usuario', password: '', tecnico_base: '', tecnico_secundario: '' };
  const [formNuevoUsuario, setFormNuevoUsuario] = useState(formInicial);
  const [formEditarUsuario, setFormEditarUsuario] = useState(null);

  // --- LÓGICA DE AUTOCOMPLETADO (Formularios de Usuario) ---
  const handleCambioZona = (zonaSeleccionada, setFormState, formState) => {
    setFormState({ ...formState, zona: zonaSeleccionada, departamento: '', centro_costo: '' });
  };

  const handleCambioDepartamento = (deptSeleccionado, zonaActual, setFormState, formState) => {
    const centroCostoAutomatico = estructuraOrganizacional[zonaActual][deptSeleccionado] || '';
    setFormState({ ...formState, departamento: deptSeleccionado, centro_costo: centroCostoAutomatico });
  };

  // --- LÓGICA DE GESTIÓN DE CATÁLOGOS (Ajustes) ---
  const handleAgregarZona = (e) => {
    e.preventDefault();
    const zonaStr = nuevaZona.trim();
    if (!zonaStr || estructuraOrganizacional[zonaStr]) return;
    setEstructuraOrganizacional({ ...estructuraOrganizacional, [zonaStr]: {} });
    setZonaSeleccionadaAjustes(zonaStr);
    setNuevaZona('');
  };

  const handleEliminarZona = (zonaEliminar) => {
    if (Object.keys(estructuraOrganizacional[zonaEliminar]).length > 0) {
      alert("No puedes eliminar una Zona que tiene departamentos adentro. Elimina los departamentos primero.");
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar la zona "${zonaEliminar}"?`)) return;

    const nuevaEstructura = { ...estructuraOrganizacional };
    delete nuevaEstructura[zonaEliminar];
    setEstructuraOrganizacional(nuevaEstructura);
    setZonaSeleccionadaAjustes(Object.keys(nuevaEstructura)[0] || '');
  };

  const handleAgregarDepto = (e) => {
    e.preventDefault();
    const deptoStr = nuevoDepto.nombre.trim();
    const ccStr = nuevoDepto.centro_costo.trim().toUpperCase();
    if (!deptoStr || !ccStr || !zonaSeleccionadaAjustes) return;

    setEstructuraOrganizacional({
      ...estructuraOrganizacional,
      [zonaSeleccionadaAjustes]: { ...estructuraOrganizacional[zonaSeleccionadaAjustes], [deptoStr]: ccStr }
    });
    setNuevoDepto({ nombre: '', centro_costo: '' });
  };

  const handleEliminarDepto = (deptoEliminar) => {
    if (!window.confirm(`¿Seguro que deseas eliminar el departamento "${deptoEliminar}" de ${zonaSeleccionadaAjustes}?`)) return;
    const nuevaEstructuraZona = { ...estructuraOrganizacional[zonaSeleccionadaAjustes] };
    delete nuevaEstructuraZona[deptoEliminar];

    setEstructuraOrganizacional({
      ...estructuraOrganizacional,
      [zonaSeleccionadaAjustes]: nuevaEstructuraZona
    });
  };

  // --- HELPERS DE DISEÑO ---
  const getRolBadge = (rol) => {
    switch (rol) {
      case 'Admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Tecnico': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getEstatusBadge = (estatus) => {
    return estatus === 'Activo' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideBusqueda = u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

  // --- ACCIONES DE USUARIOS ---
  const handleAltaUsuario = (e) => {
    e.preventDefault();
    if (formNuevoUsuario.tecnico_base === formNuevoUsuario.tecnico_secundario) {
      return alert("El Técnico de Respaldo no puede ser el mismo que el Técnico de Base.");
    }
    const nuevo = { id: Date.now(), ...formNuevoUsuario, estatus: 'Activo', fecha_ingreso: new Date().toISOString().split('T')[0] };
    setUsuarios([nuevo, ...usuarios]);
    setFormNuevoUsuario(formInicial);
    setMostrarModalAlta(false);
  };

  const abrirModalEdicion = (usuario) => {
    setFormEditarUsuario({ ...usuario });
    setMostrarModalEditar(true);
  };

  const handleGuardarEdicion = (e) => {
    e.preventDefault();
    if (formEditarUsuario.tecnico_base === formEditarUsuario.tecnico_secundario) {
      return alert("El Técnico de Respaldo no puede ser el mismo que el Técnico de Base.");
    }
    const actualizados = usuarios.map(u => u.id === formEditarUsuario.id ? formEditarUsuario : u);
    setUsuarios(actualizados);

    // Si estamos editando el usuario que está seleccionado en el Drawer, lo actualizamos también
    if (usuarioSeleccionado && usuarioSeleccionado.id === formEditarUsuario.id) {
      setUsuarioSeleccionado(formEditarUsuario);
    }
    setMostrarModalEditar(false);
  };

  const toggleEstatus = (id) => {
    const actualizados = usuarios.map(u => {
      if (u.id === id) {
        if (u.email === user?.email) { alert("No puedes desactivar tu propia cuenta."); return u; }
        return { ...u, estatus: u.estatus === 'Activo' ? 'Inactivo' : 'Activo' };
      }
      return u;
    });
    setUsuarios(actualizados);
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Directorio de Usuarios</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Gestión de accesos, roles y estructura organizacional.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMostrarModalCatalogos(true)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition border border-slate-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
            Ajustes Org.
          </button>
          <button onClick={() => { setFormNuevoUsuario(formInicial); setMostrarModalAlta(true); }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-900/50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            Nuevo Usuario
          </button>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input type="text" placeholder="Buscar por nombre o correo electrónico..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-slate-900 border border-slate-800 text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-cyan-500 transition-colors shadow-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar">
          {['Todos', 'Admin', 'Tecnico', 'Usuario'].map(rol => (
            <button key={rol} onClick={() => setFiltroRol(rol)} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition whitespace-nowrap ${filtroRol === rol ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>{rol}</button>
          ))}
        </div>
      </div>

      {/* TABLA PRINCIPAL DE USUARIOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-6">Empleado</th>
                <th className="p-4">Ubicación y C.C.</th>
                <th className="p-4">Soporte Asignado</th> {/* NUEVA COLUMNA */}
                <th className="p-4">Rol del Sistema</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 pl-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-black text-lg">{usuario.nombre_completo.charAt(0)}</div>
                    <div><p className="font-bold text-white mb-0.5">{usuario.nombre_completo}</p><p className="text-[10px] text-slate-400 font-mono">{usuario.email}</p></div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-300">{usuario.departamento}</p>
                    <div className="flex items-center gap-1.5 mt-0.5"><span className="text-[10px] text-slate-500 font-semibold uppercase">{usuario.zona}</span><span className="text-slate-600">•</span><span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-950/50 px-1.5 py-0.5 rounded">{usuario.centro_costo}</span></div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg> {usuario.tecnico_base || 'No Asignado'}</span>
                      <span className="text-[9px] text-slate-500 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg> Respaldo: {usuario.tecnico_secundario || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase ${getRolBadge(usuario.rol)}`}>{usuario.rol}</span></td>
                  <td className="p-4"><button onClick={() => toggleEstatus(usuario.id)} className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border uppercase transition hover:scale-105 ${getEstatusBadge(usuario.estatus)}`} title="Clic para cambiar estatus">{usuario.estatus}</button></td>
                  <td className="p-4 text-right pr-6 space-x-2">
                    <button onClick={() => setUsuarioSeleccionado(usuario)} className="text-cyan-400 hover:text-white transition font-bold text-[10px] uppercase tracking-widest bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded mr-2">Detalles</button>
                    <button onClick={() => abrirModalEdicion(usuario)} className="text-slate-400 hover:text-cyan-400 transition bg-slate-800 hover:bg-slate-700 p-2 rounded-lg" title="Editar Usuario"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500 font-medium">No se encontraron usuarios.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL: ALTA DE USUARIO                    */}
      {/* ========================================= */}
      {mostrarModalAlta && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                </div>
                <div><h2 className="text-lg font-black text-white">Alta de Empleado</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crear Credenciales</p></div>
              </div>
              <button onClick={() => setMostrarModalAlta(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="form-alta-usuario" onSubmit={handleAltaUsuario} className="space-y-6">

                {/* Datos Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nombre Completo *</label>
                    <input type="text" required value={formNuevoUsuario.nombre_completo} onChange={(e) => setFormNuevoUsuario({ ...formNuevoUsuario, nombre_completo: e.target.value })} placeholder="Ej. Ana García" className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Correo Electrónico *</label>
                    <input type="email" required value={formNuevoUsuario.email} onChange={(e) => setFormNuevoUsuario({ ...formNuevoUsuario, email: e.target.value.toLowerCase() })} placeholder="ejemplo@empresa.com" className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500" />
                  </div>
                </div>

                {/* Estructura Organizacional */}
                <div className="p-4 border border-slate-800 bg-slate-800/30 rounded-xl space-y-4">
                  <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Estructura Organizacional</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">1. Zona / Sucursal *</label>
                    <select required value={formNuevoUsuario.zona} onChange={(e) => handleCambioZona(e.target.value, setFormNuevoUsuario, formNuevoUsuario)} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500">
                      <option value="" disabled>Selecciona una Zona...</option>
                      {zonasDisponibles.map(zona => <option key={zona} value={zona}>{zona}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">2. Departamento *</label>
                      <select required disabled={!formNuevoUsuario.zona} value={formNuevoUsuario.departamento} onChange={(e) => handleCambioDepartamento(e.target.value, formNuevoUsuario.zona, setFormNuevoUsuario, formNuevoUsuario)} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="" disabled>Selecciona...</option>
                        {formNuevoUsuario.zona && Object.keys(estructuraOrganizacional[formNuevoUsuario.zona] || {}).map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block flex justify-between"><span>3. Centro de Costo</span> <span className="text-cyan-600 font-normal">Auto</span></label>
                      <input type="text" readOnly value={formNuevoUsuario.centro_costo} placeholder="Automático" className="w-full bg-slate-900 border border-slate-800 text-cyan-500 font-mono text-sm font-bold rounded-lg px-4 py-3 outline-none cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                {/* Ruta de Soporte (SLA) */}
                <div className="space-y-4 bg-cyan-900/10 border border-cyan-900/30 p-5 rounded-xl">
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Asignación de Soporte Técnico (SLA)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2 block">Técnico de Base *</label>
                      <select required value={formNuevoUsuario.tecnico_base} onChange={(e) => setFormNuevoUsuario({ ...formNuevoUsuario, tecnico_base: e.target.value })} className="w-full bg-slate-950 border border-green-900/50 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-green-500">
                        <option value="" disabled>Selecciona titular...</option>
                        {tecnicosDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2 block">Técnico de Respaldo *</label>
                      <select required value={formNuevoUsuario.tecnico_secundario} onChange={(e) => setFormNuevoUsuario({ ...formNuevoUsuario, tecnico_secundario: e.target.value })} className="w-full bg-slate-950 border border-orange-900/50 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-orange-500">
                        <option value="" disabled>Selecciona respaldo...</option>
                        {tecnicosDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rol y Seguridad */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Rol de Sistema *</label>
                    <select value={formNuevoUsuario.rol} onChange={(e) => setFormNuevoUsuario({ ...formNuevoUsuario, rol: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500">
                      <option value="Usuario">Usuario Estándar</option>
                      <option value="Tecnico">Técnico TI</option>
                      <option value="Admin">Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-2 block">Contraseña Temporal *</label>
                    <input type="password" required value={formNuevoUsuario.password} onChange={(e) => setFormNuevoUsuario({ ...formNuevoUsuario, password: e.target.value })} placeholder="Asigna contraseña" className="w-full bg-slate-950 border border-cyan-900/50 text-white text-sm font-mono rounded-lg px-4 py-3 outline-none focus:border-cyan-500" />
                  </div>
                </div>

              </form>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button onClick={() => setMostrarModalAlta(false)} className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 transition">Cancelar</button>
              <button form="form-alta-usuario" type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg">Crear Usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: EDITAR USUARIO                     */}
      {/* ========================================= */}
      {mostrarModalEditar && formEditarUsuario && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg border border-slate-600 text-slate-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </div>
                <div><h2 className="text-lg font-black text-white">Editar Usuario</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corrección de Datos</p></div>
              </div>
              <button onClick={() => setMostrarModalEditar(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="form-editar-usuario" onSubmit={handleGuardarEdicion} className="space-y-6">

                {/* Datos Básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nombre Completo *</label>
                    <input type="text" required value={formEditarUsuario.nombre_completo} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, nombre_completo: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Correo Electrónico *</label>
                    <input type="email" required value={formEditarUsuario.email} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, email: e.target.value.toLowerCase() })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500" />
                  </div>
                </div>

                {/* Estructura Organizacional */}
                <div className="p-4 border border-slate-800 bg-slate-800/30 rounded-xl space-y-4">
                  <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">Estructura Organizacional</h4>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">1. Zona / Sucursal *</label>
                    <select required value={formEditarUsuario.zona} onChange={(e) => handleCambioZona(e.target.value, setFormEditarUsuario, formEditarUsuario)} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500">
                      <option value="" disabled>Selecciona una Zona...</option>
                      {zonasDisponibles.map(zona => <option key={zona} value={zona}>{zona}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">2. Departamento *</label>
                      <select required disabled={!formEditarUsuario.zona} value={formEditarUsuario.departamento} onChange={(e) => handleCambioDepartamento(e.target.value, formEditarUsuario.zona, setFormEditarUsuario, formEditarUsuario)} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="" disabled>Selecciona...</option>
                        {formEditarUsuario.zona && Object.keys(estructuraOrganizacional[formEditarUsuario.zona] || {}).map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block flex justify-between"><span>3. Centro de Costo</span> <span className="text-cyan-600 font-normal">Auto</span></label>
                      <input type="text" readOnly value={formEditarUsuario.centro_costo} placeholder="Automático" className="w-full bg-slate-900 border border-slate-800 text-cyan-500 font-mono text-sm font-bold rounded-lg px-4 py-3 outline-none cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                {/* Ruta de Soporte (SLA) */}
                <div className="space-y-4 bg-cyan-900/10 border border-cyan-900/30 p-5 rounded-xl">
                  <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Asignación de Soporte Técnico (SLA)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2 block">Técnico de Base *</label>
                      <select required value={formEditarUsuario.tecnico_base} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, tecnico_base: e.target.value })} className="w-full bg-slate-950 border border-green-900/50 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-green-500">
                        <option value="" disabled>Selecciona titular...</option>
                        {tecnicosDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2 block">Técnico de Respaldo *</label>
                      <select required value={formEditarUsuario.tecnico_secundario} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, tecnico_secundario: e.target.value })} className="w-full bg-slate-950 border border-orange-900/50 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-orange-500">
                        <option value="" disabled>Selecciona respaldo...</option>
                        {tecnicosDisponibles.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rol */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Rol de Sistema *</label>
                  <select value={formEditarUsuario.rol} onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, rol: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500">
                    <option value="Usuario">Usuario Estándar</option>
                    <option value="Tecnico">Técnico TI</option>
                    <option value="Admin">Administrador</option>
                  </select>
                </div>

              </form>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button onClick={() => setMostrarModalEditar(false)} className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 transition">Cancelar</button>
              <button form="form-editar-usuario" type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg">Actualizar Datos</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* DRAWER DETALLES DEL USUARIO Y SLA           */}
      {/* ========================================= */}
      {usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-start bg-slate-800/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-white text-xl font-black border-2 border-slate-600 shadow-lg">{usuarioSeleccionado.nombre_completo.charAt(0)}</div>
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">{usuarioSeleccionado.nombre_completo}</h2>
                  <p className="text-sm font-bold text-slate-400">{usuarioSeleccionado.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => abrirModalEdicion(usuarioSeleccionado)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white p-2 rounded transition shadow" title="Editar"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                <button onClick={() => setUsuarioSeleccionado(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">

              {/* Bloque: Información Corporativa */}
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-5">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Perfil Corporativo</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div><p className="text-[10px] text-slate-500 uppercase">Departamento</p><p className="text-sm font-bold text-white">{usuarioSeleccionado.departamento}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase">Zona / Sucursal</p><p className="text-sm font-bold text-white">{usuarioSeleccionado.zona}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase">Centro de Costo</p><span className="text-[10px] font-mono font-bold text-cyan-600 bg-cyan-950/50 px-1.5 py-0.5 mt-1 rounded border border-cyan-900/50 inline-block">{usuarioSeleccionado.centro_costo}</span></div>
                  <div><p className="text-[10px] text-slate-500 uppercase">Rol Sistema</p><span className={`inline-block px-2 py-0.5 mt-1 rounded text-[9px] font-black uppercase tracking-widest border ${getRolBadge(usuarioSeleccionado.rol)}`}>{usuarioSeleccionado.rol}</span></div>
                </div>
              </div>

              {/* Bloque: Ruta de Escalación SLA (Visión Gráfica) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full pointer-events-none"></div>
                <h3 className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  Ruta de Escalación de Soporte (SLA)
                </h3>

                <div className="relative pl-4 border-l-2 border-slate-700 space-y-6 ml-2">

                  {/* Step 1: Titular */}
                  <div className="relative">
                    <span className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-green-500 flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span></span>
                    <div className="bg-slate-950 border border-green-900/30 p-3 rounded-lg ml-2">
                      <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Paso 1: Técnico Titular</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">{usuarioSeleccionado.tecnico_base ? usuarioSeleccionado.tecnico_base.charAt(0) : '?'}</div>
                        <p className="text-sm font-bold text-slate-200">{usuarioSeleccionado.tecnico_base || 'No Asignado'}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">Los tickets nuevos se asignan automáticamente aquí.</p>
                    </div>
                  </div>

                  {/* Step 2: Respaldo */}
                  <div className="relative">
                    <span className="absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-orange-500 flex items-center justify-center"><span className="w-1 h-1 bg-orange-500 rounded-full"></span></span>
                    <div className="bg-slate-950 border border-orange-900/30 p-3 rounded-lg ml-2">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">Paso 2: Técnico de Respaldo</p>
                      <div className="flex items-center gap-2 opacity-80">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">{usuarioSeleccionado.tecnico_secundario ? usuarioSeleccionado.tecnico_secundario.charAt(0) : '?'}</div>
                        <p className="text-sm font-bold text-slate-200">{usuarioSeleccionado.tecnico_secundario || 'No Asignado'}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">Se activa si el titular está <span className="text-red-400 font-bold">Ocupado</span>, de <span className="text-blue-400 font-bold">Vacaciones</span> o si el SLA entra en riesgo.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL / DRAWER: AJUSTES (ESTRUCTURA ORG)  */}
      {/* ========================================= */}
      {mostrarModalCatalogos && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg border border-slate-600 text-slate-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <div><h2 className="text-lg font-black text-white">Estructura Organizacional</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catálogo de Zonas y Departamentos</p></div>
              </div>
              <button onClick={() => setMostrarModalCatalogos(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">

              {/* SECCIÓN 1: AGREGAR NUEVA ZONA */}
              <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl mb-6">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">1. Crear Nueva Zona / Sucursal</h3>
                <form onSubmit={handleAgregarZona} className="flex gap-2">
                  <input type="text" value={nuevaZona} onChange={(e) => setNuevaZona(e.target.value)} placeholder="Ej. Sucursal Cancún" className="flex-1 bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500" />
                  <button type="submit" disabled={!nuevaZona.trim()} className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition">Añadir</button>
                </form>
              </div>

              {/* SECCIÓN 2: GESTIONAR DEPARTAMENTOS POR ZONA */}
              {zonasDisponibles.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                  <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">2. Gestionar Departamentos en:</h3>
                    <select value={zonaSeleccionadaAjustes} onChange={(e) => setZonaSeleccionadaAjustes(e.target.value)} className="bg-slate-900 border border-slate-600 text-white text-sm font-bold rounded px-2 py-1 outline-none focus:border-cyan-500">
                      {zonasDisponibles.map(zona => <option key={zona} value={zona}>{zona}</option>)}
                    </select>
                  </div>

                  <div className="p-5">
                    {/* Formulario para agregar Depto + CC */}
                    <form onSubmit={handleAgregarDepto} className="mb-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Añadir Departamento a {zonaSeleccionadaAjustes}</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Nombre Depto.</label>
                          <input type="text" required value={nuevoDepto.nombre} onChange={(e) => setNuevoDepto({ ...nuevoDepto, nombre: e.target.value })} placeholder="Ej. Logística" className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-cyan-500" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Centro de Costo</label>
                          <input type="text" required value={nuevoDepto.centro_costo} onChange={(e) => setNuevoDepto({ ...nuevoDepto, centro_costo: e.target.value.toUpperCase() })} placeholder="Ej. CC-LOG-01" className="w-full bg-slate-950 border border-slate-700 text-white text-sm uppercase rounded px-3 py-2 outline-none focus:border-cyan-500" />
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded font-bold text-[10px] uppercase tracking-wider transition">Agregar a Estructura</button>
                    </form>

                    {/* Lista de Departamentos Actuales */}
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Departamentos Actuales</p>
                    <div className="space-y-2 mb-6">
                      {Object.keys(estructuraOrganizacional[zonaSeleccionadaAjustes] || {}).length === 0 ? (
                        <p className="text-sm text-slate-500 italic text-center py-2">No hay departamentos en esta zona.</p>
                      ) : (
                        Object.entries(estructuraOrganizacional[zonaSeleccionadaAjustes]).map(([depto, cc]) => (
                          <div key={depto} className="flex justify-between items-center bg-slate-900 px-4 py-3 rounded-lg border border-slate-800 group">
                            <div>
                              <p className="text-sm font-bold text-slate-200">{depto}</p>
                              <p className="text-[10px] font-mono text-cyan-500 bg-cyan-950/50 inline-block px-1 mt-0.5 rounded border border-cyan-900/50">{cc}</p>
                            </div>
                            <button onClick={() => handleEliminarDepto(depto)} className="text-slate-500 hover:text-red-500 transition opacity-0 group-hover:opacity-100" title="Eliminar Departamento">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Botón de Peligro (Eliminar Zona) */}
                    <div className="pt-4 border-t border-slate-700 text-right">
                      <button onClick={() => handleEliminarZona(zonaSeleccionadaAjustes)} className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-widest transition border border-red-500/30 hover:bg-red-500/10 px-3 py-1.5 rounded">Eliminar {zonaSeleccionadaAjustes}</button>
                    </div>

                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900">
              <button onClick={() => setMostrarModalCatalogos(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition">Cerrar Ajustes</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

export default Usuarios;