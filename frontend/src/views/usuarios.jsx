// frontend/src/views/usuarios.jsx
import React, { useState, useEffect } from 'react';
import Pagination from '../components/Pagination';

const Usuarios = ({ user, token }) => {
  // --- ESTADOS DE DATOS REALES ---
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

  // --- CATÁLOGOS REALES ---
  const [zonas, setZonas] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos, setPuestos] = useState([]);

  // --- PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // --- PERMISOS ---
  const isAdmin = user?.rol === 'Admin';
  const isTecnico = user?.rol === 'Tecnico';
  const puedeEditar = isAdmin || isTecnico; // Solo ellos pueden crear/editar

  // Estados de UI
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('Todos');
  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  const DIAS_SEMANA = [
    { id: 0, nombre: 'Lunes' },
    { id: 1, nombre: 'Martes' },
    { id: 2, nombre: 'Miércoles' },
    { id: 3, nombre: 'Jueves' },
    { id: 4, nombre: 'Viernes' },
    { id: 5, nombre: 'Sábado' },
    { id: 6, nombre: 'Domingo' }
  ];

  const horariosIniciales = DIAS_SEMANA.map(dia => ({
    dia_semana: dia.id,
    es_laboral: dia.id < 5, // Lunes a Viernes por defecto
    hora_inicio_1: '09:00',
    hora_fin_1: '14:00',
    hora_inicio_2: '15:00',
    hora_fin_2: '18:00'
  }));

  const formInicial = { 
    nombre_completo: '', email: '', zona: '', departamento: '', centro_costo: '', puesto: '',
    rol: 'Usuario', password: '', tecnico_principal_id: '', tecnico_secundario_id: '',
    horarios: horariosIniciales, is_tecnico_principal: false,
    especialidad: '',
    empresa: '', no_empleado: '', fecha_ingreso: '', subdepartamento: '',
    proyecto: '', ciudad: '', estado: '', razon_social: '', registro_patronal: '',
    razon_social_pagadora: '', no_banca: '', banco_pagador: '',
    correo_personal: '', celular_personal: '', celular_red: '', imss: '',
    rfc: '', curp: '', fecha_nacimiento: '', edad: '', sexo: ''
  };
  const [formNuevoUsuario, setFormNuevoUsuario] = useState(formInicial);
  const [formEditarUsuario, setFormEditarUsuario] = useState(null);

  // ==========================================
  // CONEXIÓN CON BACKEND
  // ==========================================

  const fetchUsuarios = async () => {
    setCargando(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resUsers, resZonas, resDeps, resPuestos] = await Promise.all([
        fetch('http://localhost:8000/api/v1/usuarios/', { headers }),
        fetch('http://localhost:8000/api/v1/catalogos/zonas', { headers }),
        fetch('http://localhost:8000/api/v1/catalogos/departamentos', { headers }),
        fetch('http://localhost:8000/api/v1/catalogos/puestos', { headers })
      ]);

      if (resUsers.ok) setUsuarios(await resUsers.json());
      if (resZonas.ok) setZonas(await resZonas.json());
      if (resDeps.ok) setDepartamentos(await resDeps.json());
      if (resPuestos.ok) setPuestos(await resPuestos.json());

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsuarios();
  }, [token]);

  // Lista de técnicos reales para los selects
  const tecnicosDisponibles = usuarios.filter(u => u.rol === 'Tecnico' || u.rol === 'Admin');

  // --- ACCIONES POST/PUT ---
  const handleAltaUsuario = async (e) => {
    e.preventDefault();
    if (formNuevoUsuario.tecnico_principal_id === formNuevoUsuario.tecnico_secundario_id && formNuevoUsuario.tecnico_principal_id !== "") {
      return alert("El Técnico de Respaldo no puede ser el mismo que el principal.");
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/usuarios/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formNuevoUsuario)
      });

      if (response.ok) {
        alert("Usuario creado con éxito");
        fetchUsuarios();
        setMostrarModalAlta(false);
        setFormNuevoUsuario(formInicial);
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      alert("Error de conexión.");
    }
  };

  const abrirModalEdicion = (usuario) => {
    // Normalizar horarios si no existen (ej: usuarios viejos)
    const horariosNormalizados = DIAS_SEMANA.map(dia => {
      const hExistente = usuario.horarios?.find(xh => xh.dia_semana === dia.id);
      return hExistente || {
        dia_semana: dia.id,
        es_laboral: dia.id < 5,
        hora_inicio_1: '09:00',
        hora_fin_1: '14:00',
        hora_inicio_2: '15:00',
        hora_fin_2: '18:00'
      };
    });
    // Limpiamos el campo password al abrir para que solo se envíe si el admin lo llena
    setFormEditarUsuario({ ...usuario, password: '', horarios: horariosNormalizados });
    setMostrarModalEditar(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (formEditarUsuario.tecnico_principal_id === formEditarUsuario.tecnico_secundario_id && formEditarUsuario.tecnico_principal_id !== "") {
      return alert("El Técnico de Respaldo no puede ser el mismo que el principal.");
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/usuarios/${formEditarUsuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formEditarUsuario)
      });

      if (response.ok) {
        fetchUsuarios();
        setMostrarModalEditar(false);
        if (usuarioSeleccionado?.id === formEditarUsuario.id) setUsuarioSeleccionado(null);
      } else {
        const err = await response.json();
        alert(`Error: ${err.detail}`);
      }
    } catch (error) {
      alert("Error al actualizar.");
    }
  };

  const toggleEstatus = async (usuario) => {
    if (!puedeEditar) return;
    if (usuario.email === user?.email) return alert("No puedes desactivarte a ti mismo.");
    const nuevoEstatus = usuario.estatus === 'Activo' ? 'Inactivo' : 'Activo';

    try {
      await fetch(`http://localhost:8000/api/v1/usuarios/${usuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ estatus: nuevoEstatus })
      });
      fetchUsuarios();
    } catch (error) {
      alert("Error al cambiar estatus.");
    }
  };

  const handleExportarExcel = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/usuarios/export/excel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `directorio_gnn_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        alert("Error al exportar Excel");
      }
    } catch (err) { alert("Error de conexión al exportar."); }
  };

  const handleImportarExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/v1/usuarios/import/excel', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        if (data.errores.length > 0) {
          alert(`Importación completada con ${data.importados} usuarios. Errores: \n${data.errores.join('\n')}`);
        } else {
          alert(`¡Éxito! Se importaron ${data.importados} usuarios.`);
        }
        fetchUsuarios();
      } else {
        alert(data.detail || "Error al importar Excel");
      }
    } catch (err) {
      alert("Error de conexión al importar.");
    } finally {
      e.target.value = ''; // Limpiar input
    }
  };

  // --- HELPERS ---
  const getNombreTecnico = (id) => {
    const t = usuarios.find(u => u.id === id);
    return t ? t.nombre_completo : 'No Asignado';
  };

  const handleCambioZona = (zonaNombre, setForm, currentForm) => {
    setForm({ ...currentForm, zona: zonaNombre, departamento: '', centro_costo: '' });
  };

  const handleCambioDepartamento = (deptNombre, setForm, currentForm) => {
    const deptObj = departamentos.find(d => d.nombre === deptNombre && d.zona?.nombre === currentForm.zona);
    const ccCodigo = deptObj?.centro_costo?.codigo || '';
    setForm({ ...currentForm, departamento: deptNombre, centro_costo: ccCodigo });
  };

  const handleCambioHorario = (diaIdx, campo, valor, setForm, currentForm) => {
    const nuevosHorarios = [...currentForm.horarios];
    nuevosHorarios[diaIdx] = { ...nuevosHorarios[diaIdx], [campo]: valor };
    setForm({ ...currentForm, horarios: nuevosHorarios });
  };

  // Estilos claros para Roles
  const getRolBadge = (rol) => {
    switch (rol) {
      case 'Admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Tecnico': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideBusqueda = u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideRol = filtroRol === 'Todos' || u.rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

  // Paginación lógica
  const indiceUltimoItem = paginaActual * itemsPorPagina;
  const indicePrimerItem = indiceUltimoItem - itemsPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indicePrimerItem, indiceUltimoItem);

  // Resetear página al filtrar
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroRol]);

  return (
    <div className="relative h-full flex flex-col font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Directorio de Usuarios</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gestión de acceso y enrutamiento técnico.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={handleExportarExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                <i className="pi pi-file-excel text-xs"></i> Exportar
              </button>
              <button onClick={() => document.getElementById('import-excel-usuarios').click()} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                <i className="pi pi-upload text-xs"></i> Importar
              </button>
              <input type="file" id="import-excel-usuarios" className="hidden" accept=".xlsx, .xls" onChange={handleImportarExcel} />
            </>
          )}
          {puedeEditar && (
            <button onClick={() => setMostrarModalAlta(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input type="text" placeholder="Buscar empleado por nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded shadow-sm pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar-light pb-2 md:pb-0">
          {['Todos', 'Admin', 'Tecnico', 'Usuario'].map(rol => (
            <button key={rol} onClick={() => setFiltroRol(rol)}
              className={`px-4 py-2 rounded font-semibold text-xs whitespace-nowrap transition-colors shadow-sm ${filtroRol === rol ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
              {rol}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA PRINCIPAL (Tema Claro) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar-light">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Empleado</th>
                <th className="p-4">Ubicación / C.C.</th>
                <th className="p-4">Soporte SLA</th>
                <th className="p-4">Rol</th>
                <th className="p-4">Estatus</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cargando ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Cargando directorio...</td></tr>
              ) : usuariosPaginados.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500 italic">No se encontraron usuarios.</td></tr>
              ) : (
                usuariosPaginados.map((u) => (
                  <tr key={u.id} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <p className="font-bold text-slate-800">{u.nombre_completo}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-slate-700 font-semibold">{u.departamento || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{u.zona || 'N/A'} • {u.centro_costo || 'N/A'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-blue-700">Titular: {getNombreTecnico(u.tecnico_principal_id)}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Respaldo: {getNombreTecnico(u.tecnico_secundario_id)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getRolBadge(u.rol)}`}>{u.rol}</span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => puedeEditar && toggleEstatus(u)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider transition-colors ${!puedeEditar ? 'cursor-default opacity-80' : 'cursor-pointer hover:shadow-sm'} ${u.estatus === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                      >
                        {u.estatus}
                      </button>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setUsuarioSeleccionado(u)} className="text-blue-600 font-semibold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors">Ver Perfil</button>
                        {puedeEditar && (
                          <button onClick={() => abrirModalEdicion(u)} className="text-slate-400 hover:text-blue-600 transition bg-white hover:bg-slate-100 border border-slate-200 p-1.5 rounded shadow-sm" title="Editar">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          totalItems={usuariosFiltrados.length}
          itemsPerPage={itemsPorPagina}
          currentPage={paginaActual}
          onPageChange={setPaginaActual}
          onItemsPerPageChange={setItemsPorPagina}
        />
      </div>

      {/* ========================================= */}
      {/* MODAL ALTA (Modo Claro)                   */}
      {/* ========================================= */}
      {mostrarModalAlta && puedeEditar && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[500px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Nuevo Empleado</h2>
              <button onClick={() => setMostrarModalAlta(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <form onSubmit={handleAltaUsuario} className="flex-1 overflow-y-auto p-6 custom-scrollbar-light space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nombre Completo <span className="text-red-500">*</span></label>
                <input type="text" required value={formNuevoUsuario.nombre_completo} onChange={e => setFormNuevoUsuario({ ...formNuevoUsuario, nombre_completo: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Correo Corporativo <span className="text-red-500">*</span></label>
                <input type="email" required value={formNuevoUsuario.email} onChange={e => setFormNuevoUsuario({ ...formNuevoUsuario, email: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Zona <span className="text-red-500">*</span></label>
                  <select required value={formNuevoUsuario.zona} onChange={e => handleCambioZona(e.target.value, setFormNuevoUsuario, formNuevoUsuario)} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                    <option value="">Seleccionar...</option>
                    {zonas.map(z => <option key={z.id} value={z.nombre}>{z.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Departamento <span className="text-red-500">*</span></label>
                  <select required disabled={!formNuevoUsuario.zona} value={formNuevoUsuario.departamento} onChange={e => handleCambioDepartamento(e.target.value, setFormNuevoUsuario, formNuevoUsuario)} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 disabled:bg-slate-100 cursor-pointer shadow-sm">
                    <option value="">Seleccionar...</option>
                    {departamentos.filter(d => d.zona?.nombre === formNuevoUsuario.zona).map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Puesto <span className="text-red-500">*</span></label>
                <select required value={formNuevoUsuario.puesto} onChange={e => setFormNuevoUsuario({ ...formNuevoUsuario, puesto: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                  <option value="">Seleccionar...</option>
                  {puestos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Enrutamiento de Soporte (SLA)</p>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Técnico Titular <span className="text-red-500">*</span></label>
                  <select required value={formNuevoUsuario.tecnico_principal_id} onChange={e => setFormNuevoUsuario({ ...formNuevoUsuario, tecnico_principal_id: parseInt(e.target.value) })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2 rounded outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                    <option value="">Asignar titular...</option>
                    {tecnicosDisponibles.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Técnico Respaldo <span className="text-red-500">*</span></label>
                  <select required value={formNuevoUsuario.tecnico_secundario_id} onChange={e => setFormNuevoUsuario({ ...formNuevoUsuario, tecnico_secundario_id: parseInt(e.target.value) })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2 rounded outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                    <option value="">Asignar respaldo...</option>
                    {tecnicosDisponibles.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nivel de Acceso (Rol) <span className="text-red-500">*</span></label>
                <select required value={formNuevoUsuario.rol} onChange={e => setFormNuevoUsuario({ ...formNuevoUsuario, rol: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                  <option value="Usuario">Usuario Estándar</option>
                  <option value="Tecnico">Técnico TI</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>

              {/* ✅ CALENDARIO LABORAL (ESTILO OUTLOOK) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Calendario Laboral</p>
                <div className="space-y-3">
                  {DIAS_SEMANA.map((dia, idx) => {
                    const h = formNuevoUsuario.horarios[idx];
                    return (
                      <div key={dia.id} className="flex flex-col gap-2 p-2 border-b border-slate-200 last:border-0">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={h.es_laboral} onChange={e => handleCambioHorario(idx, 'es_laboral', e.target.checked, setFormNuevoUsuario, formNuevoUsuario)} className="rounded text-blue-600" />
                            <span className={`text-sm font-bold ${h.es_laboral ? 'text-slate-800' : 'text-slate-400'}`}>{dia.nombre}</span>
                          </label>
                        </div>
                        {h.es_laboral && (
                          <div className="grid grid-cols-2 gap-2 pl-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Turno 1</span>
                              <div className="flex items-center gap-1">
                                <input type="time" value={h.hora_inicio_1} onChange={e => handleCambioHorario(idx, 'hora_inicio_1', e.target.value, setFormNuevoUsuario, formNuevoUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                                <span className="text-slate-400">-</span>
                                <input type="time" value={h.hora_fin_1} onChange={e => handleCambioHorario(idx, 'hora_fin_1', e.target.value, setFormNuevoUsuario, formNuevoUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Turno 2 (Opcional)</span>
                              <div className="flex items-center gap-1">
                                <input type="time" value={h.hora_inicio_2} onChange={e => handleCambioHorario(idx, 'hora_inicio_2', e.target.value, setFormNuevoUsuario, formNuevoUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                                <span className="text-slate-400">-</span>
                                <input type="time" value={h.hora_fin_2} onChange={e => handleCambioHorario(idx, 'hora_fin_2', e.target.value, setFormNuevoUsuario, formNuevoUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DATOS ORGANIZACIONALES */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Datos Organizacionales</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Empresa</label>
                    <input type="text" value={formNuevoUsuario.empresa} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, empresa: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">No. Empleado</label>
                    <input type="text" value={formNuevoUsuario.no_empleado} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, no_empleado: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Ingreso</label>
                    <input type="date" value={formNuevoUsuario.fecha_ingreso} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, fecha_ingreso: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Subdepartamento</label>
                    <input type="text" value={formNuevoUsuario.subdepartamento} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, subdepartamento: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                {formNuevoUsuario.rol === 'Tecnico' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-600 uppercase">Especialidad Técnica</label>
                      <select value={formNuevoUsuario.especialidad} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, especialidad: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm">
                        <option value="">Soporte General</option>
                        <option value="Desarrollo">Desarrollo</option>
                        <option value="Infraestructura">Infraestructura</option>
                        <option value="Redes">Redes</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Proyecto</label>
                    <input type="text" value={formNuevoUsuario.proyecto} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, proyecto: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ciudad</label>
                    <input type="text" value={formNuevoUsuario.ciudad} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, ciudad: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                    <input type="text" value={formNuevoUsuario.estado} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, estado: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Reg. Patronal</label>
                    <input type="text" value={formNuevoUsuario.registro_patronal} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, registro_patronal: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Razón Social</label>
                  <input type="text" value={formNuevoUsuario.razon_social} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, razon_social: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Razón Social Pagadora</label>
                  <input type="text" value={formNuevoUsuario.razon_social_pagadora} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, razon_social_pagadora: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">No. Banca</label>
                    <input type="text" value={formNuevoUsuario.no_banca} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, no_banca: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Banco Pagador</label>
                    <input type="text" value={formNuevoUsuario.banco_pagador} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, banco_pagador: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
              </div>

              {/* DATOS PERSONALES */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Datos Personales</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Correo Personal</label>
                    <input type="email" value={formNuevoUsuario.correo_personal} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, correo_personal: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Celular Personal</label>
                    <input type="text" value={formNuevoUsuario.celular_personal} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, celular_personal: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Celular Red</label>
                    <input type="text" value={formNuevoUsuario.celular_red} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, celular_red: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">IMSS</label>
                    <input type="text" value={formNuevoUsuario.imss} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, imss: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">RFC</label>
                    <input type="text" value={formNuevoUsuario.rfc} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, rfc: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CURP</label>
                    <input type="text" value={formNuevoUsuario.curp} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, curp: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">F. Nacimiento</label>
                    <input type="date" value={formNuevoUsuario.fecha_nacimiento} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, fecha_nacimiento: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Edad</label>
                    <input type="number" value={formNuevoUsuario.edad} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, edad: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sexo</label>
                  <select value={formNuevoUsuario.sexo} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, sexo: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm">
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* ✅ NUEVO: Configuración para Técnicos */}
              {(formNuevoUsuario.rol === 'Tecnico' || formNuevoUsuario.rol === 'Admin') && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg space-y-4">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Disponibilidad de Turno</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Entrada</label>
                      <input type="time" value={formNuevoUsuario.horario_entrada} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, horario_entrada: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Salida</label>
                      <input type="time" value={formNuevoUsuario.horario_salida} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, horario_salida: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="main_tec" checked={formNuevoUsuario.is_tecnico_principal} onChange={e => setFormNuevoUsuario({...formNuevoUsuario, is_tecnico_principal: e.target.checked})} className="rounded text-indigo-600" />
                    <label htmlFor="main_tec" className="text-xs font-bold text-slate-600 italic">Es Técnico Principal de Guardia</label>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Contraseña Temporal <span className="text-red-500">*</span></label>
                <input type="password" required value={formNuevoUsuario.password} onChange={e => setFormNuevoUsuario({ ...formNuevoUsuario, password: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
            </form>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
              <button type="button" onClick={() => setMostrarModalAlta(false)} className="px-5 py-2 rounded text-sm font-medium bg-white border border-slate-300 text-slate-600 hover:text-slate-800 transition shadow-sm">Cancelar</button>
              <button type="submit" form="form-alta-licencia" onClick={handleAltaUsuario} className="px-5 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">Crear Usuario</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL EDICIÓN (Modo Claro)                */}
      {/* ========================================= */}
      {mostrarModalEditar && formEditarUsuario && puedeEditar && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[500px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Editar Usuario</h2>
              <button onClick={() => setMostrarModalEditar(false)} className="text-slate-400 hover:bg-slate-200 p-2 rounded transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="flex-1 overflow-y-auto p-6 custom-scrollbar-light space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nombre Completo <span className="text-red-500">*</span></label>
                <input type="text" required value={formEditarUsuario.nombre_completo} onChange={e => setFormEditarUsuario({ ...formEditarUsuario, nombre_completo: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Correo Corporativo <span className="text-red-500">*</span></label>
                <input type="email" required value={formEditarUsuario.email} onChange={e => setFormEditarUsuario({ ...formEditarUsuario, email: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Zona <span className="text-red-500">*</span></label>
                  <select required value={formEditarUsuario.zona || ''} onChange={e => handleCambioZona(e.target.value, setFormEditarUsuario, formEditarUsuario)} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                    <option value="">Seleccionar...</option>
                    {zonas.map(z => <option key={z.id} value={z.nombre}>{z.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Departamento <span className="text-red-500">*</span></label>
                  <select required disabled={!formEditarUsuario.zona} value={formEditarUsuario.departamento || ''} onChange={e => handleCambioDepartamento(e.target.value, setFormEditarUsuario, formEditarUsuario)} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 disabled:bg-slate-100 cursor-pointer shadow-sm">
                    <option value="">Seleccionar...</option>
                    {departamentos.filter(d => d.zona?.nombre === formEditarUsuario.zona).map(d => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Puesto <span className="text-red-500">*</span></label>
                <select required value={formEditarUsuario.puesto || ''} onChange={e => setFormEditarUsuario({ ...formEditarUsuario, puesto: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                  <option value="">Seleccionar...</option>
                  {puestos.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                </select>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Enrutamiento de Soporte (SLA)</p>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Técnico Titular</label>
                  <select value={formEditarUsuario.tecnico_principal_id || ''} onChange={e => setFormEditarUsuario({ ...formEditarUsuario, tecnico_principal_id: parseInt(e.target.value) })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2 rounded outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                    <option value="">Ninguno</option>
                    {tecnicosDisponibles.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Técnico Respaldo</label>
                  <select value={formEditarUsuario.tecnico_secundario_id || ''} onChange={e => setFormEditarUsuario({ ...formEditarUsuario, tecnico_secundario_id: parseInt(e.target.value) })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2 rounded outline-none focus:border-blue-500 shadow-sm cursor-pointer">
                    <option value="">Ninguno</option>
                    {tecnicosDisponibles.map(t => <option key={t.id} value={t.id}>{t.nombre_completo}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Nivel de Acceso (Rol) <span className="text-red-500">*</span></label>
                <select required value={formEditarUsuario.rol} onChange={e => setFormEditarUsuario({ ...formEditarUsuario, rol: e.target.value })} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 cursor-pointer shadow-sm">
                  <option value="Usuario">Usuario Estándar</option>
                  <option value="Tecnico">Técnico TI</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>

              {/* ✅ CALENDARIO LABORAL (ESTILO OUTLOOK) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Calendario Laboral</p>
                <div className="space-y-3">
                  {DIAS_SEMANA.map((dia, idx) => {
                    const h = formEditarUsuario.horarios[idx];
                    return (
                      <div key={dia.id} className="flex flex-col gap-2 p-2 border-b border-slate-200 last:border-0">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={h.es_laboral} onChange={e => handleCambioHorario(idx, 'es_laboral', e.target.checked, setFormEditarUsuario, formEditarUsuario)} className="rounded text-blue-600" />
                            <span className={`text-sm font-bold ${h.es_laboral ? 'text-slate-800' : 'text-slate-400'}`}>{dia.nombre}</span>
                          </label>
                        </div>
                        {h.es_laboral && (
                          <div className="grid grid-cols-2 gap-2 pl-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Turno 1</span>
                              <div className="flex items-center gap-1">
                                <input type="time" value={h.hora_inicio_1} onChange={e => handleCambioHorario(idx, 'hora_inicio_1', e.target.value, setFormEditarUsuario, formEditarUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                                <span className="text-slate-400">-</span>
                                <input type="time" value={h.hora_fin_1} onChange={e => handleCambioHorario(idx, 'hora_fin_1', e.target.value, setFormEditarUsuario, formEditarUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Turno 2 (Opcional)</span>
                              <div className="flex items-center gap-1">
                                <input type="time" value={h.hora_inicio_2} onChange={e => handleCambioHorario(idx, 'hora_inicio_2', e.target.value, setFormEditarUsuario, formEditarUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                                <span className="text-slate-400">-</span>
                                <input type="time" value={h.hora_fin_2} onChange={e => handleCambioHorario(idx, 'hora_fin_2', e.target.value, setFormEditarUsuario, formEditarUsuario)} className="bg-white border border-slate-300 p-1 rounded text-xs w-full" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DATOS ORGANIZACIONALES (Edición) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Datos Organizacionales</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Empresa</label>
                    <input type="text" value={formEditarUsuario.empresa || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, empresa: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">No. Empleado</label>
                    <input type="text" value={formEditarUsuario.no_empleado || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, no_empleado: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Ingreso</label>
                    <input type="date" value={formEditarUsuario.fecha_ingreso?.split('T')[0] || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, fecha_ingreso: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Subdepartamento</label>
                    <input type="text" value={formEditarUsuario.subdepartamento || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, subdepartamento: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                {formEditarUsuario.rol === 'Tecnico' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-600 uppercase">Especialidad Técnica</label>
                      <select value={formEditarUsuario.especialidad || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, especialidad: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm">
                        <option value="">Soporte General</option>
                        <option value="Desarrollo">Desarrollo</option>
                        <option value="Infraestructura">Infraestructura</option>
                        <option value="Redes">Redes</option>
                      </select>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Proyecto</label>
                    <input type="text" value={formEditarUsuario.proyecto || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, proyecto: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Ciudad</label>
                    <input type="text" value={formEditarUsuario.ciudad || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, ciudad: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Estado</label>
                    <input type="text" value={formEditarUsuario.estado || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, estado: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Reg. Patronal</label>
                    <input type="text" value={formEditarUsuario.registro_patronal || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, registro_patronal: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Razón Social</label>
                  <input type="text" value={formEditarUsuario.razon_social || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, razon_social: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Razón Social Pagadora</label>
                  <input type="text" value={formEditarUsuario.razon_social_pagadora || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, razon_social_pagadora: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">No. Banca</label>
                    <input type="text" value={formEditarUsuario.no_banca || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, no_banca: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Banco Pagador</label>
                    <input type="text" value={formEditarUsuario.banco_pagador || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, banco_pagador: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
              </div>

              {/* DATOS PERSONALES (Edición) */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Datos Personales</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Correo Personal</label>
                    <input type="email" value={formEditarUsuario.correo_personal || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, correo_personal: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Celular Personal</label>
                    <input type="text" value={formEditarUsuario.celular_personal || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, celular_personal: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Celular Red</label>
                    <input type="text" value={formEditarUsuario.celular_red || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, celular_red: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">IMSS</label>
                    <input type="text" value={formEditarUsuario.imss || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, imss: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">RFC</label>
                    <input type="text" value={formEditarUsuario.rfc || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, rfc: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">CURP</label>
                    <input type="text" value={formEditarUsuario.curp || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, curp: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">F. Nacimiento</label>
                    <input type="date" value={formEditarUsuario.fecha_nacimiento?.split('T')[0] || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, fecha_nacimiento: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Edad</label>
                    <input type="number" value={formEditarUsuario.edad || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, edad: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sexo</label>
                  <select value={formEditarUsuario.sexo || ''} onChange={e => setFormEditarUsuario({...formEditarUsuario, sexo: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm">
                    <option value="">Seleccionar...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* ✅ NUEVO: Configuración para Técnicos (Edición) */}
              {(formEditarUsuario.rol === 'Tecnico' || formEditarUsuario.rol === 'Admin') && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-lg space-y-4">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Disponibilidad de Turno</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Entrada</label>
                      <input type="time" value={formEditarUsuario.horario_entrada || '09:00'} onChange={e => setFormEditarUsuario({...formEditarUsuario, horario_entrada: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Salida</label>
                      <input type="time" value={formEditarUsuario.horario_salida || '18:00'} onChange={e => setFormEditarUsuario({...formEditarUsuario, horario_salida: e.target.value})} className="w-full bg-white border border-slate-300 p-2 rounded text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="edit_main_tec" checked={formEditarUsuario.is_tecnico_principal || false} onChange={e => setFormEditarUsuario({...formEditarUsuario, is_tecnico_principal: e.target.checked})} className="rounded text-indigo-600" />
                    <label htmlFor="edit_main_tec" className="text-xs font-bold text-slate-600 italic">Es Técnico Principal de Guardia</label>
                  </div>
                </div>
              )}

              {/* BLOQUE DE RESETEO DE CONTRASEÑA */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <label className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 block">Resetear Contraseña</label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  value={formEditarUsuario.password}
                  onChange={(e) => setFormEditarUsuario({ ...formEditarUsuario, password: e.target.value })}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-sm"
                />
                <p className="text-[11px] font-medium text-slate-500 mt-2">Solo escribe aquí si el usuario perdió su acceso.</p>
              </div>
            </form>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
              <button type="button" onClick={() => setMostrarModalEditar(false)} className="px-5 py-2 rounded text-sm font-medium bg-white border border-slate-300 text-slate-600 hover:text-slate-800 transition shadow-sm">Cancelar</button>
              <button type="submit" onClick={handleGuardarEdicion} className="px-5 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* DRAWER DETALLES (Modo Claro)                */}
      {/* ========================================= */}
      {usuarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[450px] bg-white border-l border-slate-200 p-8 animate-slide-in-right shadow-2xl flex flex-col h-full">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                Expediente Digital
              </h2>
              <button onClick={() => setUsuarioSeleccionado(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative shadow-sm">
                {puedeEditar && (
                  <button onClick={() => abrirModalEdicion(usuarioSeleccionado)} className="absolute top-4 right-4 bg-white border border-slate-200 hover:bg-blue-50 text-slate-500 hover:text-blue-600 p-2 rounded shadow-sm transition" title="Editar este perfil">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                )}
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Datos Generales</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shadow-inner">
                    {usuarioSeleccionado.nombre_completo.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 pr-10">{usuarioSeleccionado.nombre_completo}</p>
                    <p className="text-blue-600 font-medium text-sm">{usuarioSeleccionado.email}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getRolBadge(usuarioSeleccionado.rol)}`}>{usuarioSeleccionado.rol}</span>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${usuarioSeleccionado.estatus === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{usuarioSeleccionado.estatus}</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-5">Ruta de Soporte Asignada</p>
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-white shadow-sm"></span>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paso 1: Titular</p>
                    <p className="text-slate-800 font-bold mt-0.5">{getNombreTecnico(usuarioSeleccionado.tecnico_principal_id)}</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-white shadow-sm"></span>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Paso 2: Respaldo</p>
                    <p className="text-slate-800 font-bold mt-0.5">{getNombreTecnico(usuarioSeleccionado.tecnico_secundario_id)}</p>
                  </div>
                </div>
              </div>

              {/* DETALLES ORGANIZACIONALES (Vista) */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Información Organizacional</p>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Empresa</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.empresa || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">No. Empleado</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.no_empleado || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha Ingreso</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.fecha_ingreso ? new Date(usuarioSeleccionado.fecha_ingreso).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Subdepartamento</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.subdepartamento || 'N/A'}</p>
                  </div>
                  {usuarioSeleccionado.rol === 'Tecnico' && (
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase">Especialidad Técnica</p>
                      <p className="text-sm font-semibold text-indigo-600">{usuarioSeleccionado.especialidad || 'Soporte General'}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Proyecto</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.proyecto || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Ciudad</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.ciudad || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Estado</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.estado || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Reg. Patronal</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.registro_patronal || 'N/A'}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Razón Social</p>
                  <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.razon_social || 'N/A'}</p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Razón Social Pagadora</p>
                  <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.razon_social_pagadora || 'N/A'}</p>
                </div>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">No. Banca</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.no_banca || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Banco Pagador</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.banco_pagador || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* DETALLES PERSONALES (Vista) */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Información Personal</p>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Correo Personal</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{usuarioSeleccionado.correo_personal || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Celular</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.celular_personal || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Celular Red</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.celular_red || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">RFC</p>
                    <p className="text-sm font-semibold text-slate-700 uppercase">{usuarioSeleccionado.rfc || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">CURP</p>
                    <p className="text-sm font-semibold text-slate-700 uppercase">{usuarioSeleccionado.curp || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">IMSS</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.imss || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">F. Nacimiento</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.fecha_nacimiento ? new Date(usuarioSeleccionado.fecha_nacimiento).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Edad</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.edad || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Sexo</p>
                    <p className="text-sm font-semibold text-slate-700">{usuarioSeleccionado.sexo || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* ✅ NUEVO: Disponibilidad */}
              <div className="bg-indigo-50/30 border border-indigo-100 p-6 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4">Calendario Laboral</p>
                <div className="space-y-2">
                  {usuarioSeleccionado.horarios?.length > 0 ? (
                    usuarioSeleccionado.horarios.sort((a,b) => a.dia_semana - b.dia_semana).map(h => (
                      <div key={h.id} className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${h.es_laboral ? 'text-slate-700' : 'text-slate-400'}`}>
                          {DIAS_SEMANA.find(d => d.id === h.dia_semana)?.nombre}:
                        </span>
                        <span className="text-slate-600">
                          {h.es_laboral ? (
                            <>
                              {h.hora_inicio_1} - {h.hora_fin_1}
                              {h.hora_inicio_2 && h.hora_fin_2 && ` / ${h.hora_inicio_2} - ${h.hora_fin_2}`}
                            </>
                          ) : 'No Laboral'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-center bg-white p-3 rounded-lg border border-slate-100 flex-1 mx-1 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Entrada</p>
                        <p className="font-black text-slate-700">{usuarioSeleccionado.horario_entrada || '09:00'}</p>
                      </div>
                      <div className="text-center bg-white p-3 rounded-lg border border-slate-100 flex-1 mx-1 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Salida</p>
                        <p className="font-black text-slate-700">{usuarioSeleccionado.horario_salida || '18:00'}</p>
                      </div>
                    </div>
                  )}
                </div>
                {usuarioSeleccionado.is_tecnico_principal && (
                  <div className="mt-4 flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md animate-pulse">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    TÉCNICO PRINCIPAL DE GUARDIA
                  </div>
                )}
              </div>
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