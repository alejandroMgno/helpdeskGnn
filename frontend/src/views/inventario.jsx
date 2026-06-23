// frontend/src/views/inventario.jsx
import React, { useState, useRef, useEffect } from 'react';
import Pagination from '../components/Pagination';
import clienteAxios from '../api/axios';

// --- COMPONENTES AUXILIARES (Definidos arriba para evitar ReferenceErrors) ---
const formatoMoneda = (m) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(m || 0);

const DetailItem = ({ label, value }) => (
    <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}:</span>
        <span className="text-xs font-black text-slate-700">{value || '---'}</span>
    </div>
);

const SpecBlock = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><i className={icon}></i></div>
        <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-slate-700">{value || '---'}</p>
        </div>
    </div>
);

const SectionHeader = ({ label, color }) => (
    <p className={`text-[10px] font-black text-${color}-600 uppercase tracking-[0.3em] flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full bg-${color}-500`}></span> {label}
    </p>
);

const FormInput = ({ label, value, onChange, type = "text", required = false }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label} {required && '*'}</label>
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} required={required} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
    </div>
);

const Inventario = ({ user, token }) => {
  // --- PAGINACIÓN ---
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);

  // --- CATÁLOGOS ---
  const [catalogoCategorias] = useState([
    'Equipo de Cómputo', 'Celular', 'Monitor', 'Impresora', 'Teclado', 'Mouse', 'Servidor', 'Tablet', 'Red', 'Periférico'
  ]);
  const [catalogoUsuarios, setCatalogoUsuarios] = useState([]);
  const [catalogoLicencias, setCatalogoLicencias] = useState([]);
  const [catalogoMarcas, setCatalogoMarcas] = useState([]);
  const [catalogoProveedores, setCatalogoProveedores] = useState([]);
  const [catalogoModelosParte, setCatalogoModelosParte] = useState([]);

  // --- ESTADO PRINCIPAL ---
  const [activos, setActivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [pestañaActiva, setPestañaActiva] = useState('detalles');

  const [mostrarModalBitacora, setMostrarModalBitacora] = useState(false);
  const [formBitacora, setFormBitacora] = useState({ tipo: 'Preventivo', descripcion: '', costo: 0, fecha: new Date().toISOString().split('T')[0] });

  // NUEVOS MODALES BAJA
  const [mostrarModalBaja, setMostrarModalBaja] = useState(false);
  const [formBaja, setFormBaja] = useState({ motivo: 'Robo', notas: '', archivos: [] });
  const [idsSeleccionados, setIdsSeleccionados] = useState([]);
  const [mostrarModalBajaDefinitiva, setMostrarModalBajaDefinitiva] = useState(false);

  // Modales
  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalReasignar, setMostrarModalReasignar] = useState(false);
  const [mostrarModalCatalogos, setMostrarModalCatalogos] = useState(false);
  const [mostrarModalResguardo, setMostrarModalResguardo] = useState(false);
  const [mostrarModalFirma, setMostrarModalFirma] = useState(false);

  // --- FIRMA DIGITAL ---
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [firmaDigital, setFirmaDigital] = useState(null);

  // --- FORMULARIOS ---
  const [formNuevoActivo, setFormNuevoActivo] = useState({ 
    codigo: '', numero_parte: '', modelo_parte_id: null, nombre: '', modelo: '', marca_id: '', proveedor_id: '', tipo: 'Equipo de Cómputo', 
    costo: '', anios_garantia: 1, imei: '', chip: '', serie: '', ram: '', cpu: '',
    pulgadas: '', almacenamiento: '', formato: '', rma: '', factura_numero: '', fecha_compra: new Date().toISOString().split('T')[0],
    fecha_ultimo_mantenimiento: '', meses_mantenimiento: 6
  });
  const [formEditarActivo, setFormEditarActivo] = useState(null);
  const [formReasignar, setFormReasignar] = useState({ nuevo_asignado_id: '', notas: '', licencias_ids: [] });
  const [formNuevoCatalogo, setFormNuevoCatalogo] = useState({ tipo: 'marca', nombre: '', descripcion: '', rfc: '' });

  const isAdmin = user?.rol === 'Admin';
  const isTecnico = user?.rol === 'Tecnico';
  const puedeEditar = isAdmin || isTecnico;

  // --- TECLA ESCAPE PARA CERRAR ---
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setActivoSeleccionado(null);
        setMostrarModalAlta(false);
        setMostrarModalEditar(false);
        setMostrarModalReasignar(false);
        setMostrarModalCatalogos(false);
        setMostrarModalResguardo(false);
        setMostrarModalFirma(false);
        setMostrarModalBitacora(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- CARGA DE DATOS ---
  const cargarCatalogos = async () => {
    try {
      const [resUsers, resLics, resMarcas, resProvs, resModelos] = await Promise.all([
        clienteAxios.get('/usuarios/'),
        clienteAxios.get('/licencias/'),
        clienteAxios.get('/catalogos/marcas'),
        clienteAxios.get('/catalogos/proveedores'),
        clienteAxios.get('/catalogos/modelos-parte')
      ]);
      setCatalogoUsuarios(resUsers.data);
      setCatalogoLicencias(resLics.data);
      setCatalogoMarcas(resMarcas.data);
      setCatalogoProveedores(resProvs.data);
      setCatalogoModelosParte(resModelos.data);
    } catch (err) { console.error("Error catálogos", err); }
  };

  const handleBusquedaParte = async (numParte, setForm, currentForm) => {
    if (!numParte) return;
    try {
        const res = await clienteAxios.get(`/catalogos/modelos-parte/search/${numParte}`);
        const data = res.data;
        setForm({
            ...currentForm,
            numero_parte: data.numero_parte,
            modelo_parte_id: data.id,
            nombre: data.nombre,
            modelo: data.nombre,
            marca_id: data.marca_id || '',
            tipo: data.tipo || currentForm.tipo,
            ram: data.ram || '',
            cpu: data.cpu || '',
            almacenamiento: data.almacenamiento || '',
            pulgadas: data.pulgadas || '',
            rma: data.rma || ''
        });
    } catch (err) {
        console.log("Número de parte no encontrado en catálogo");
    }
  };

  const fetchActivos = async (idParaActualizar = null) => {
    setCargando(true);
    try {
      const response = await clienteAxios.get('/activos/');
      const activosMapeados = response.data.map(dbActivo => {
        // ✅ HUMANIZACIÓN: Usar el objeto 'usuario' que viene del backend
        return {
          ...dbActivo,
          asignado_a: dbActivo.usuario ? dbActivo.usuario.nombre_completo : 'Sin Asignar',
          departamento: dbActivo.usuario ? dbActivo.usuario.departamento : 'Sistemas',
          categoria: dbActivo.tipo,
          marca_nombre: dbActivo.marca?.nombre || dbActivo.marca_texto || 'N/A',
          proveedor_nombre: dbActivo.proveedor?.nombre || 'N/A'
        };
      });
      setActivos(activosMapeados);

      // Si se proporcionó un ID, actualizar el activo seleccionado con la nueva data
      if (idParaActualizar) {
        const actualizado = activosMapeados.find(a => a.id === idParaActualizar);
        if (actualizado) setActivoSeleccionado(actualizado);
      }
    } catch (error) { console.error(error); }
    finally { setCargando(false); }
  };

  const handleRegistrarBitacora = async (e) => {
    e.preventDefault();
    try {
        await clienteAxios.post(`/activos/${activoSeleccionado.id}/mantenimientos`, formBitacora);
        alert("¡Mantenimiento registrado en bitácora!");
        setMostrarModalBitacora(false);
        setFormBitacora({ tipo: 'Preventivo', descripcion: '', costo: 0, fecha: new Date().toISOString().split('T')[0] });
        fetchActivos(activoSeleccionado.id); // 🔥 RECARGA Y MANTÉN ABIERTO
    } catch (err) { alert("Error al registrar bitácora"); }
  };

  useEffect(() => {
    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (catalogoUsuarios.length > 0) fetchActivos();
  }, [catalogoUsuarios]);

  // --- ACCIONES API ---
  const handleAltaActivo = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formNuevoActivo,
        marca_id: formNuevoActivo.marca_id ? parseInt(formNuevoActivo.marca_id) : null,
        proveedor_id: formNuevoActivo.proveedor_id ? parseInt(formNuevoActivo.proveedor_id) : null,
        costo: formNuevoActivo.costo ? parseFloat(formNuevoActivo.costo) : 0,
        fecha_compra: formNuevoActivo.fecha_compra ? new Date(formNuevoActivo.fecha_compra).toISOString() : null,
        fecha_ultimo_mantenimiento: formNuevoActivo.fecha_ultimo_mantenimiento ? new Date(formNuevoActivo.fecha_ultimo_mantenimiento).toISOString() : null
      };
      await clienteAxios.post('/activos/', payload);
      alert("¡Activo registrado y mantenimiento programado!");
      fetchActivos();
      setMostrarModalAlta(false);
      setFormNuevoActivo({ 
        codigo: '', nombre: '', modelo: '', marca_id: '', proveedor_id: '', tipo: 'Equipo de Cómputo', 
        costo: '', anios_garantia: 1, imei: '', chip: '', serie: '', ram: '', cpu: '',
        pulgadas: '', almacenamiento: '', factura_numero: '', fecha_compra: new Date().toISOString().split('T')[0],
        fecha_ultimo_mantenimiento: '', meses_mantenimiento: 6
      });
    } catch (error) { alert("Error al crear activo."); }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formEditarActivo,
        marca_id: formEditarActivo.marca_id ? parseInt(formEditarActivo.marca_id) : null,
        proveedor_id: formEditarActivo.proveedor_id ? parseInt(formEditarActivo.proveedor_id) : null,
        costo: formEditarActivo.costo ? parseFloat(formEditarActivo.costo) : 0,
        fecha_compra: formEditarActivo.fecha_compra ? new Date(formEditarActivo.fecha_compra).toISOString() : null,
        fecha_ultimo_mantenimiento: formEditarActivo.fecha_ultimo_mantenimiento ? new Date(formEditarActivo.fecha_ultimo_mantenimiento).toISOString() : null
      };
      await clienteAxios.put(`/activos/${formEditarActivo.id}`, payload);
      fetchActivos();
      setMostrarModalEditar(false);
      setActivoSeleccionado(null);
      alert("Cambios guardados.");
    } catch (error) { alert("Error al actualizar."); }
  };

  const handleAbrirEditar = (a) => {
    // 🔥 FIX: Formatear fechas para que el input type="date" las reconozca (YYYY-MM-DD)
    const formataFecha = (d) => d ? d.split('T')[0] : '';
    
    setFormEditarActivo({
        ...a,
        fecha_compra: formataFecha(a.fecha_compra),
        fecha_ultimo_mantenimiento: formataFecha(a.fecha_ultimo_mantenimiento),
        notas: "" // Reset notas for new edit
    });
    setMostrarModalEditar(true);
  };

  const handleRegistrarMantenimientoRapido = async (activo) => {
    if(!window.confirm("¿Confirmas que el mantenimiento se realizó hoy?")) return;
    try {
        await clienteAxios.put(`/activos/${activo.id}`, {
            fecha_ultimo_mantenimiento: new Date().toISOString(),
            notas: "Mantenimiento preventivo rápido registrado desde la lista."
        });
        fetchActivos(activo.id); // 🔥 RECARGA Y MANTÉN ABIERTO
        alert("Mantenimiento registrado. Se recalculó la próxima fecha.");
    } catch (error) { alert("Error al registrar."); }
  };

  const handleReasignar = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.put(`/activos/${activoSeleccionado.id}`, {
        usuario_id: parseInt(formReasignar.nuevo_asignado_id),
        estatus: 'Asignado',
        licencias_ids: formReasignar.licencias_ids,
        notas: formReasignar.notas
      });
      fetchActivos();
      setMostrarModalReasignar(false);
      setActivoSeleccionado(null);
      alert("Equipo reasignado correctamente.");
    } catch (error) { alert("Error al reasignar."); }
  };

  const handleLiberarAStock = async (activo) => {
    if(!window.confirm(`¿Seguro que quieres liberar el activo ${activo.codigo} a stock? Esto desvinculará todas las licencias actuales.`)) return;
    try {
        await clienteAxios.put(`/activos/${activo.id}`, {
            estatus: 'Disponible',
            usuario_id: null,
            notas: "Liberación manual a stock (disponible)."
        });
        fetchActivos();
        setActivoSeleccionado(null);
        alert("Equipo liberado a stock correctamente.");
    } catch (error) { 
        console.error(error);
        alert("Error al liberar."); 
    }
  };

  const handleCrearCatalogo = async (e) => {
    e.preventDefault();
    const url = formNuevoCatalogo.tipo === 'marca' ? 'marcas' : 'proveedores';
    try {
      await clienteAxios.post(`/catalogos/${url}`, {
        nombre: formNuevoCatalogo.nombre,
        descripcion: formNuevoCatalogo.descripcion,
        rfc: formNuevoCatalogo.rfc
      });
      alert("Catálogo actualizado");
      cargarCatalogos();
      setFormNuevoCatalogo({ ...formNuevoCatalogo, nombre: '', descripcion: '', rfc: '' });
    } catch (err) { alert("Error al crear catálogo"); }
  };

  const handleSoftDelete = async (activo) => {
    setActivoSeleccionado(activo);
    setFormBaja({ motivo: 'Robo', notas: '', archivos: [] });
    setMostrarModalBaja(true);
  };

  const handleBaja = async (e) => {
    e.preventDefault();
    if ((formBaja.motivo === 'Robo' || formBaja.motivo === 'Venta') && formBaja.archivos.length === 0) {
        alert(`Para baja por ${formBaja.motivo.toLowerCase()} es obligatorio subir el comprobante (PDF).`);
        return;
    }

    const formData = new FormData();
    formData.append('motivo', formBaja.motivo);
    formData.append('notas', formBaja.notas);
    formBaja.archivos.forEach(file => {
        formData.append('files', file);
    });

    try {
        await clienteAxios.post(`/activos/${activoSeleccionado.id}/baja`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert(`Activo dado de baja por ${formBaja.motivo.toLowerCase()}.`);
        setMostrarModalBaja(false);
        setActivoSeleccionado(null);
        fetchActivos();
    } catch (err) {
        alert(err.response?.data?.detail || "Error al procesar la baja.");
    }
  };

  const toggleSeleccion = (id) => {
    setIdsSeleccionados(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBajaDefinitiva = async () => {
    if (idsSeleccionados.length === 0) return;
    if (!window.confirm(`¿Estás seguro de aplicar BAJA DEFINITIVA a los ${idsSeleccionados.length} activos seleccionados? Esta acción es irreversible.`)) return;
    
    try {
        await clienteAxios.post('/activos/baja-definitiva-lote', idsSeleccionados);
        alert("Baja definitiva aplicada correctamente.");
        setIdsSeleccionados([]);
        setMostrarModalBajaDefinitiva(false);
        fetchActivos();
    } catch (err) {
        alert("Error al aplicar baja definitiva.");
    }
  };

  const handleExportarExcel = async () => {
    try {
        const response = await clienteAxios.get('/activos/export/excel', { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `inventario_gnn_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) { alert("Error al exportar Excel"); }
  };

  const handleImportarExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await clienteAxios.post('/activos/import/excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.errores.length > 0) {
            alert(`Importación completada con ${res.data.importados} activos. Errores: \n${res.data.errores.join('\n')}`);
        } else {
            alert(`¡Éxito! Se importaron ${res.data.importados} activos.`);
        }
        fetchActivos();
    } catch (err) {
        alert(err.response?.data?.detail || "Error al importar Excel");
    } finally {
        e.target.value = ''; // Limpiar input
    }
  };

  // --- LÓGICA DE FIRMA ---
  const startDrawing = (e) => { setIsDrawing(true); const ctx = canvasRef.current.getContext('2d'); const rect = canvasRef.current.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000"; };
  const draw = (e) => { if (!isDrawing) return; const ctx = canvasRef.current.getContext('2d'); const rect = canvasRef.current.getBoundingClientRect(); ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke(); };
  const stopDrawing = () => setIsDrawing(false);
  const limpiarFirma = () => canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  const guardarFirma = () => { setFirmaDigital(canvasRef.current.toDataURL("image/png")); setMostrarModalFirma(false); };

  // --- HELPERS UI ---
  const getEstatusBadge = (s) => {
    const styles = { 'Asignado': 'bg-green-50 text-green-700 border-green-200', 'Disponible': 'bg-blue-50 text-blue-700 border-blue-200', 'En Mantenimiento': 'bg-amber-50 text-amber-700 border-amber-200', 'Dado de Baja': 'bg-red-50 text-red-700 border-red-200' };
    return styles[s] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const calcularSaludActivo = (activo) => {
    if (!activo.fecha_proximo_mantenimiento) return 100;
    
    const ahora = new Date();
    const proximo = new Date(activo.fecha_proximo_mantenimiento);
    const ultimo = activo.fecha_ultimo_mantenimiento ? new Date(activo.fecha_ultimo_mantenimiento) : new Date(activo.fecha_compra);
    
    const totalMs = proximo - ultimo;
    const transcurridoMs = ahora - ultimo;
    
    // Si ya venció o el total es inválido
    if (totalMs <= 0 || ahora >= proximo) return 0;
    
    // Si aún no llega la fecha del último (caso raro de fecha futura)
    if (ahora <= ultimo) return 100;

    const porcentaje = Math.max(0, Math.min(100, 100 - (transcurridoMs / totalMs) * 100));
    return Math.round(porcentaje);
  };

  const activosFiltrados = activos.filter(a => {
    const cumpleCategoria = filtroCategoria === 'Todas' || a.categoria === filtroCategoria;
    const searchLower = busqueda.toLowerCase();
    const cumpleBusqueda = 
      a.codigo?.toLowerCase().includes(searchLower) ||
      a.nombre?.toLowerCase().includes(searchLower) ||
      a.modelo?.toLowerCase().includes(searchLower) ||
      a.serie?.toLowerCase().includes(searchLower) ||
      a.marca_nombre?.toLowerCase().includes(searchLower) ||
      a.asignado_a?.toLowerCase().includes(searchLower);
    return cumpleCategoria && cumpleBusqueda;
  });

  const activosPaginados = activosFiltrados.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventario de Activos</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gestión integral del ciclo de vida y salud de activos.</p>
        </div>
        <div className="flex gap-2">
          {puedeEditar && (
            <>
              {isAdmin && idsSeleccionados.length > 0 && (
                <button onClick={() => setMostrarModalBajaDefinitiva(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                    <i className="pi pi-trash text-xs"></i> Baja Definitiva ({idsSeleccionados.length})
                </button>
              )}
              <button onClick={handleExportarExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                <i className="pi pi-file-excel text-xs"></i> Exportar
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => document.getElementById('import-excel-activos').click()} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                    <i className="pi pi-upload text-xs"></i> Importar
                  </button>
                  <input type="file" id="import-excel-activos" className="hidden" accept=".xlsx, .xls" onChange={handleImportarExcel} />
                </>
              )}
              <button onClick={() => setMostrarModalCatalogos(true)} className="bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 px-4 py-2 rounded shadow-sm font-semibold text-xs transition">
                Catálogos
              </button>
              <button onClick={() => setMostrarModalAlta(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                <i className="pi pi-plus text-xs"></i> Alta de Activo
              </button>
            </>
          )}
        </div>
      </div>

      {/* FILTROS Y BUSQUEDA */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 w-full print:hidden">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input type="text" placeholder="Buscar por código, serie, modelo, marca o asignado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded shadow-sm pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scrollbar-light pb-2 md:pb-0">
          {['Todas', ...catalogoCategorias].map(cat => (
            <button 
              key={cat} 
              onClick={() => setFiltroCategoria(cat)} 
              className={`px-4 py-2 rounded font-semibold text-xs whitespace-nowrap transition-colors shadow-sm ${filtroCategoria === cat ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex-1 flex flex-col print:hidden">
        <div className="flex-1 overflow-auto custom-scrollbar-light">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
              <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6 w-10">
                    {isAdmin && (
                        <input type="checkbox" 
                            checked={idsSeleccionados.length === activosPaginados.length && activosPaginados.length > 0}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setIdsSeleccionados(activosPaginados.map(a => a.id));
                                } else {
                                    setIdsSeleccionados([]);
                                }
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        />
                    )}
                </th>
                <th className="p-4">Activo / Serie</th>
                <th className="p-4">Especificaciones</th>
                <th className="p-4">Asignación</th>
                <th className="p-4">Estado Salud</th>
                <th className="p-4 text-right pr-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {cargando ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Sincronizando inventario...</td></tr>
              ) : activosPaginados.map(a => (
                <tr key={a.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    {isAdmin && (
                        <input type="checkbox" 
                            checked={idsSeleccionados.includes(a.id)}
                            onChange={() => toggleSeleccion(a.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                        />
                    )}
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{a.codigo}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">{a.serie || 'S/N'}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700 font-semibold">{a.modelo}</p>
                    <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">{a.marca_nombre} • {a.categoria}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-slate-700 font-semibold">{a.asignado_a}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider mt-1 inline-block ${getEstatusBadge(a.estatus)}`}>{a.estatus}</span>
                  </td>
                  <td className="p-4">
                    <div className="w-32">
                        <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                            <span>Próximo: {a.fecha_proximo_mantenimiento ? new Date(a.fecha_proximo_mantenimiento).toLocaleDateString() : 'N/A'}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ${calcularSaludActivo(a) < 30 ? 'bg-red-500' : calcularSaludActivo(a) < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${calcularSaludActivo(a)}%` }}></div>
                        </div>
                    </div>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button onClick={() => setActivoSeleccionado(a)} className="text-blue-600 font-semibold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors">Ver Detalles</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination totalItems={activosFiltrados.length} itemsPerPage={itemsPorPagina} currentPage={paginaActual} onPageChange={setPaginaActual} onItemsPerPageChange={setItemsPorPagina} />
      </div>

      {/* DRAWER DETALLES (Expediente Digital) */}
      {activoSeleccionado && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity print:hidden">
          <div className="w-full md:w-[450px] bg-white border-l border-slate-200 p-8 animate-slide-in-right shadow-2xl flex flex-col h-full">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <i className="pi pi-box text-slate-400"></i>
                Detalles del Activo
              </h2>
              <button onClick={() => setActivoSeleccionado(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar-light pr-2">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Información General</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shadow-inner">
                    {activoSeleccionado.categoria.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-800 pr-4">{activoSeleccionado.modelo}</p>
                    <p className="text-blue-600 font-medium text-sm">{activoSeleccionado.codigo}</p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 flex gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200">{activoSeleccionado.categoria}</span>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${getEstatusBadge(activoSeleccionado.estatus)}`}>{activoSeleccionado.estatus}</span>
                </div>
              </div>

              {/* ACCIONES RÁPIDAS (NUEVO UX) */}
              {puedeEditar && (
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => handleAbrirEditar(activoSeleccionado)} 
                        title="Editar Activo"
                        className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-blue-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                        <i className="pi pi-pencil text-blue-500 text-sm"></i> EDITAR
                    </button>
                    <button onClick={() => {
                        setFormReasignar({ nuevo_asignado_id: '', notas: '', licencias_ids: activoSeleccionado.licencias?.map(l => l.id) || [] });
                        setMostrarModalReasignar(true);
                    }} 
                        title="Reasignar Usuario"
                        className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-amber-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                        <i className="pi pi-user-edit text-amber-500 text-sm"></i> REASIG.
                    </button>
                    <button onClick={() => handleLiberarAStock(activoSeleccionado)} 
                        title="Liberar a Stock"
                        className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                        <i className="pi pi-refresh text-slate-500 text-sm"></i> STOCK
                    </button>
                    <button onClick={() => setMostrarModalResguardo(true)} 
                        title="Generar Resguardo PDF"
                        className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-emerald-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                        <i className="pi pi-file-pdf text-emerald-500 text-sm"></i> PDF
                    </button>
                    <button onClick={() => handleSoftDelete(activoSeleccionado)} 
                        title="Dar de Baja"
                        className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                        <i className="pi pi-trash text-red-500 text-sm"></i> BAJA
                    </button>
                </div>
              )}

              {/* TABS SIMPLIFICADOS */}
              <div className="flex gap-4 border-b border-slate-100">
                {['detalles', 'specs', 'licencias', 'historial', 'bitacora'].map(t => (
                    <button key={t} onClick={() => setPestañaActiva(t)} className={`pb-2 text-[10px] font-black uppercase tracking-wider transition-colors border-b-2 ${pestañaActiva === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                        {t === 'bitacora' ? 'Bitácora' : t === 'specs' ? 'Ficha' : t === 'licencias' ? 'Licencias' : t}
                    </button>
                ))}
              </div>

              {pestañaActiva === 'licencias' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Software del Usuario Asignado</p>
                  </div>
                  {(!activoSeleccionado.usuario?.licencias || activoSeleccionado.usuario.licencias.length === 0) ? (
                      <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <i className="pi pi-shield text-slate-300 text-2xl mb-2"></i>
                          <p className="text-xs text-slate-400 font-bold uppercase">{activoSeleccionado.usuario ? 'El usuario no tiene software asignado' : 'Activo sin asignar (Disponible)'}</p>
                      </div>
                  ) : (
                      <div className="space-y-2">
                          {activoSeleccionado.usuario.licencias.map(l => (
                              <div key={l.id} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center group shadow-sm">
                                  <div>
                                      <p className="text-sm font-bold text-slate-800">{l.nombre || 'Sin nombre'}</p>
                                      <p className="text-[10px] text-blue-600 font-bold uppercase">{l.categoria || 'Sin categoría'}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${l.estatus === 'Expirada' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                      {l.estatus || 'Vigente'}
                                  </span>
                              </div>
                          ))}
                      </div>
                  )}
                </div>
              )}

              {pestañaActiva === 'bitacora' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <SectionHeader label="Bitácora Técnica" color="indigo" />
                        {puedeEditar && (
                            <button onClick={() => setMostrarModalBitacora(true)} className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-lg shadow-sm shadow-indigo-100">+ REGISTRAR</button>
                        )}
                    </div>
                    
                    {activoSeleccionado.mantenimientos?.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <i className="pi pi-calendar-times text-slate-300 text-2xl mb-2"></i>
                            <p className="text-xs text-slate-400 font-bold">Sin mantenimientos registrados</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activoSeleccionado.mantenimientos.map(m => (
                                <div key={m.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-indigo-300 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${m.tipo === 'Correctivo' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>{m.tipo}</span>
                                        <span className="text-[10px] font-bold text-slate-400">{new Date(m.fecha).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 leading-relaxed mb-2">{m.descripcion}</p>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">T</div>
                                            <span className="text-[10px] font-bold text-slate-500">{m.tecnico?.nombre_completo || 'Técnico GNN'}</span>
                                        </div>
                                        {puedeEditar && (
                                          <span className="text-xs font-black text-slate-800">{formatoMoneda(m.costo)}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
              )}

              {pestañaActiva === 'detalles' && (
                <div className="space-y-4">
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">Adquisición y Garantía</p>
                        <div className="space-y-3">
                            <DetailItem label="N° de Parte" value={activoSeleccionado.numero_parte} />
                            <DetailItem label="RMA / Ext." value={activoSeleccionado.rma} />
                            <div className="border-t border-slate-50 my-2"></div>
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Proveedor:</span> <span className="font-bold text-slate-700">{activoSeleccionado.proveedor_nombre}</span></div>
                            {puedeEditar && (
                              <>
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Factura:</span> <span className="font-bold text-slate-700">{activoSeleccionado.factura_numero || 'N/A'}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-slate-500">Costo:</span> <span className="font-bold text-slate-700">{formatoMoneda(activoSeleccionado.costo)}</span></div>
                              </>
                            )}
                            <div className="flex justify-between text-sm"><span className="text-slate-500">Compra:</span> <span className="font-bold text-slate-700">{new Date(activoSeleccionado.fecha_compra).toLocaleDateString()}</span></div>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4">Asignación Actual</p>
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-slate-800 font-bold">{activoSeleccionado.asignado_a}</p>
                                <p className="text-[11px] text-slate-500 font-medium">{activoSeleccionado.departamento}</p>
                            </div>
                            {puedeEditar && (
                                <button onClick={() => setMostrarModalReasignar(true)} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors">Reasignar</button>
                            )}
                        </div>
                    </div>
                </div>
              )}

              {pestañaActiva === 'specs' && (
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm grid grid-cols-2 gap-4">
                    <div className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2 mb-2">Ficha Técnica Especializada</div>
                    
                    {activoSeleccionado.categoria === 'Equipo de Cómputo' || activoSeleccionado.categoria === 'Servidor' || activoSeleccionado.categoria === 'Tablet' ? (
                        <>
                            <div><p className="text-[10px] text-slate-500 uppercase">Procesador (CPU)</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.cpu || '---'}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase">Memoria RAM</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.ram || '---'}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase">Almacenamiento (SSD/HDD)</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.almacenamiento || '---'}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase">Tamaño Pantalla</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.pulgadas || '---'}</p></div>
                            <div className="col-span-2 pt-2 border-t border-slate-50 mt-2"><p className="text-[10px] text-slate-500 uppercase">Número de Serie</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.serie || '---'}</p></div>
                        </>
                    ) : activoSeleccionado.categoria === 'Celular' ? (
                        <>
                            <div className="col-span-2"><p className="text-[10px] text-slate-500 uppercase">IMEI</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.imei || '---'}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase">Memoria RAM</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.ram || '---'}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase">Almacenamiento</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.almacenamiento || '---'}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase">Línea (Chip)</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.chip || '---'}</p></div>
                            <div><p className="text-[10px] text-slate-500 uppercase">Número de Serie</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.serie || '---'}</p></div>
                        </>
                    ) : activoSeleccionado.categoria === 'Monitor' ? (
                        <>
                            <div className="col-span-2"><p className="text-[10px] text-slate-500 uppercase">Medida (Pulgadas)</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.pulgadas || '---'}</p></div>
                            <div className="col-span-2"><p className="text-[10px] text-slate-500 uppercase">Número de Serie</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.serie || '---'}</p></div>
                        </>
                    ) : (
                        <div className="col-span-2"><p className="text-[10px] text-slate-500 uppercase">Número de Serie</p><p className="text-sm font-bold text-slate-700">{activoSeleccionado.serie || '---'}</p></div>
                    )}
                </div>
              )}

              {pestañaActiva === 'historial' && (
                <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-5">Línea de Tiempo</p>
                    <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                        {activoSeleccionado.historial?.map((h, i) => (
                            <div key={i} className="relative">
                                <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-white shadow-sm"></span>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{new Date(h.fecha).toLocaleDateString()}</p>
                                <p className="text-slate-800 font-bold mt-0.5 text-sm">{h.evento}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{h.notas}</p>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA / EDITAR UNIFICADO (SIDE DRAWER) */}
      {(mostrarModalAlta || mostrarModalEditar) && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
            <div className="w-full md:w-[600px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slide-in-right">
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{mostrarModalAlta ? 'Nuevo Activo ITAM' : 'Editar Activo'}</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestión de Ciclo de Vida</p>
                    </div>
                    <button onClick={() => { setMostrarModalAlta(false); setMostrarModalEditar(false); }} className="text-slate-400 hover:bg-slate-200 p-2 rounded transition">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="asset-form-unificado" onSubmit={mostrarModalAlta ? handleAltaActivo : handleGuardarEdicion} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar-light">
                    
                    {/* Identidad */}
                    <div className="space-y-5">
                        <SectionHeader label="Identidad y Clasificación" color="blue" />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Código Inventario *</label>
                                <input required type="text" value={mostrarModalAlta ? formNuevoActivo.codigo : formEditarActivo.codigo} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, codigo: e.target.value.toUpperCase()}) : setFormEditarActivo({...formEditarActivo, codigo: e.target.value.toUpperCase()})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tipo de Dispositivo *</label>
                                <select required value={mostrarModalAlta ? formNuevoActivo.tipo : formEditarActivo.tipo} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, tipo: e.target.value}) : setFormEditarActivo({...formEditarActivo, tipo: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm">
                                    {catalogoCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ✅ NÚMERO DE PARTE (AUTORELLENADO) */}
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-3">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Catálogo por Número de Parte</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Ej: 20W0004XLM"
                                    value={mostrarModalAlta ? formNuevoActivo.numero_parte : formEditarActivo.numero_parte} 
                                    onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, numero_parte: e.target.value}) : setFormEditarActivo({...formEditarActivo, numero_parte: e.target.value})}
                                    className="flex-1 bg-white border border-blue-200 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" 
                                />
                                <button 
                                    type="button"
                                    onClick={() => mostrarModalAlta ? handleBusquedaParte(formNuevoActivo.numero_parte, setFormNuevoActivo, formNuevoActivo) : handleBusquedaParte(formEditarActivo.numero_parte, setFormEditarActivo, formEditarActivo)}
                                    className="bg-blue-600 text-white px-4 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                >
                                    AUTORELLENAR
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-400 italic">Si el número de parte existe en el catálogo, se completarán las specs técnicas automáticamente.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Marca *</label>
                                <select required value={mostrarModalAlta ? formNuevoActivo.marca_id : formEditarActivo.marca_id} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, marca_id: e.target.value}) : setFormEditarActivo({...formEditarActivo, marca_id: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm">
                                    <option value="">Seleccionar...</option>
                                    {catalogoMarcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Modelo Comercial *</label>
                                <input required type="text" value={mostrarModalAlta ? formNuevoActivo.modelo : formEditarActivo.modelo} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, modelo: e.target.value}) : setFormEditarActivo({...formEditarActivo, modelo: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Número de Serie</label>
                            <input type="text" value={mostrarModalAlta ? formNuevoActivo.serie : formEditarActivo.serie} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, serie: e.target.value}) : setFormEditarActivo({...formEditarActivo, serie: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                        </div>
                    </div>

                    {/* Ficha Técnica */}
                    <div className="space-y-5">
                        <SectionHeader label="Especificaciones Técnicas" color="emerald" />
                        
                        {(mostrarModalAlta ? formNuevoActivo.tipo : formEditarActivo?.tipo) === 'Equipo de Cómputo' || 
                         (mostrarModalAlta ? formNuevoActivo.tipo : formEditarActivo?.tipo) === 'Servidor' || 
                         (mostrarModalAlta ? formNuevoActivo.tipo : formEditarActivo?.tipo) === 'Tablet' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Formato *</label>
                                        <select required value={mostrarModalAlta ? formNuevoActivo.formato : formEditarActivo.formato} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, formato: e.target.value}) : setFormEditarActivo({...formEditarActivo, formato: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm">
                                            <option value="">Seleccionar...</option>
                                            <option value="Laptop">Laptop</option>
                                            <option value="Desktop">Desktop</option>
                                            <option value="All-in-One">All-in-One</option>
                                            <option value="Servidor Rack">Servidor Rack</option>
                                            <option value="Servidor Torre">Servidor Torre</option>
                                            <option value="Tablet">Tablet</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Procesador (CPU)</label>
                                        <input type="text" value={mostrarModalAlta ? formNuevoActivo.cpu : formEditarActivo.cpu} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, cpu: e.target.value}) : setFormEditarActivo({...formEditarActivo, cpu: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Memoria RAM</label>
                                        <input type="text" value={mostrarModalAlta ? formNuevoActivo.ram : formEditarActivo.ram} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, ram: e.target.value}) : setFormEditarActivo({...formEditarActivo, ram: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Almacenamiento (SSD/HDD)</label>
                                        <input type="text" value={mostrarModalAlta ? formNuevoActivo.almacenamiento : formEditarActivo.almacenamiento} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, almacenamiento: e.target.value}) : setFormEditarActivo({...formEditarActivo, almacenamiento: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tamaño Pantalla</label>
                                    <input type="text" value={mostrarModalAlta ? formNuevoActivo.pulgadas : formEditarActivo.pulgadas} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, pulgadas: e.target.value}) : setFormEditarActivo({...formEditarActivo, pulgadas: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">RMA / Garantía Extendida</label>
                                    <input type="text" value={mostrarModalAlta ? formNuevoActivo.rma : formEditarActivo.rma} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, rma: e.target.value}) : setFormEditarActivo({...formEditarActivo, rma: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                </div>
                            </>
                        ) : (mostrarModalAlta ? formNuevoActivo.tipo : formEditarActivo?.tipo) === 'Celular' ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">IMEI *</label>
                                        <input required type="text" value={mostrarModalAlta ? formNuevoActivo.imei : formEditarActivo.imei} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, imei: e.target.value}) : setFormEditarActivo({...formEditarActivo, imei: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Memoria RAM</label>
                                        <input type="text" value={mostrarModalAlta ? formNuevoActivo.ram : formEditarActivo.ram} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, ram: e.target.value}) : setFormEditarActivo({...formEditarActivo, ram: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Almacenamiento</label>
                                        <input type="text" value={mostrarModalAlta ? formNuevoActivo.almacenamiento : formEditarActivo.almacenamiento} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, almacenamiento: e.target.value}) : setFormEditarActivo({...formEditarActivo, almacenamiento: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Línea (Chip / Número)</label>
                                    <input type="text" value={mostrarModalAlta ? formNuevoActivo.chip : formEditarActivo.chip} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, chip: e.target.value}) : setFormEditarActivo({...formEditarActivo, chip: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                                </div>
                            </>
                        ) : (mostrarModalAlta ? formNuevoActivo.tipo : formEditarActivo?.tipo) === 'Monitor' ? (
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tamaño Pantalla (Pulgadas)</label>
                                <input type="text" value={mostrarModalAlta ? formNuevoActivo.pulgadas : formEditarActivo.pulgadas} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, pulgadas: e.target.value}) : setFormEditarActivo({...formEditarActivo, pulgadas: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                        ) : (
                            <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sin especificaciones adicionales requeridas</p>
                            </div>
                        )}
                    </div>

                    {/* Mantenimiento */}
                    <div className="space-y-5">
                        <SectionHeader label="Control de Mantenimiento" color="indigo" />
                        <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-2xl space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-indigo-700 mb-1.5 block">Último Mantenimiento</label>
                                <input type="date" value={mostrarModalAlta ? formNuevoActivo.fecha_ultimo_mantenimiento : formEditarActivo.fecha_ultimo_mantenimiento} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, fecha_ultimo_mantenimiento: e.target.value}) : setFormEditarActivo({...formEditarActivo, fecha_ultimo_mantenimiento: e.target.value})} className="w-full bg-white border border-indigo-200 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-indigo-500 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-indigo-700 mb-1.5 block">Frecuencia (Meses)</label>
                                <input type="number" value={mostrarModalAlta ? formNuevoActivo.meses_mantenimiento : formEditarActivo.meses_mantenimiento} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, meses_mantenimiento: e.target.value}) : setFormEditarActivo({...formEditarActivo, meses_mantenimiento: e.target.value})} className="w-full bg-white border border-indigo-200 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-indigo-500 shadow-sm" />
                            </div>
                        </div>
                    </div>

                    {/* Adquisición */}
                    <div className="space-y-5">
                        <SectionHeader label="Datos de Compra" color="slate" />
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Proveedor</label>
                            <select value={mostrarModalAlta ? formNuevoActivo.proveedor_id : formEditarActivo.proveedor_id} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, proveedor_id: e.target.value}) : setFormEditarActivo({...formEditarActivo, proveedor_id: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm">
                                <option value="">Seleccionar...</option>
                                {catalogoProveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Fecha Compra</label>
                                <input type="date" value={mostrarModalAlta ? formNuevoActivo.fecha_compra : formEditarActivo.fecha_compra} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, fecha_compra: e.target.value}) : setFormEditarActivo({...formEditarActivo, fecha_compra: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">N° Factura</label>
                                <input type="text" value={mostrarModalAlta ? formNuevoActivo.factura_numero : formEditarActivo.factura_numero} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, factura_numero: e.target.value}) : setFormEditarActivo({...formEditarActivo, factura_numero: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Costo (MXN)</label>
                                <input type="number" value={mostrarModalAlta ? formNuevoActivo.costo : formEditarActivo.costo} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, costo: e.target.value}) : setFormEditarActivo({...formEditarActivo, costo: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Garantía (Años)</label>
                                <input type="number" value={mostrarModalAlta ? formNuevoActivo.anios_garantia : formEditarActivo.anios_garantia} onChange={e => mostrarModalAlta ? setFormNuevoActivo({...formNuevoActivo, anios_garantia: e.target.value}) : setFormEditarActivo({...formEditarActivo, anios_garantia: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm" />
                            </div>
                        </div>
                        {mostrarModalEditar && (
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notas de la actualización (Se guardarán en historial)</label>
                                <textarea placeholder="Ej: Cambio de disco duro, actualización de RAM..." value={formEditarActivo.notas} onChange={e => setFormEditarActivo({...formEditarActivo, notas: e.target.value})} className="w-full bg-white border border-slate-300 text-slate-800 text-sm p-2.5 rounded outline-none focus:border-blue-500 shadow-sm min-h-[80px]" />
                            </div>
                        )}
                    </div>
                </form>
                
                <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                    <button onClick={() => { setMostrarModalAlta(false); setMostrarModalEditar(false); }} className="px-6 py-2 rounded text-sm font-medium bg-white border border-slate-300 text-slate-600 hover:text-slate-800 transition shadow-sm">Cancelar</button>
                    <button form="asset-form-unificado" type="submit" className="px-8 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm shadow-blue-100">
                        {mostrarModalAlta ? 'Crear Activo' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL REASIGNAR */}
      {mostrarModalReasignar && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b flex justify-between bg-slate-50">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Cambiar Asignación</h3>
                      <button onClick={() => setMostrarModalReasignar(false)}>✕</button>
                  </div>
                  <form onSubmit={handleReasignar} className="p-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nuevo Responsable</label>
                        <select required value={formReasignar.nuevo_asignado_id} onChange={e => setFormReasignar({...formReasignar, nuevo_asignado_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                            <option value="">-- Seleccionar Usuario --</option>
                            {catalogoUsuarios.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                        </select>
                      </div>

                      {/* LICENCIAS VINCULADAS */}
                      {activoSeleccionado.licencias?.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Licencias a conservar</label>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar-light">
                                {activoSeleccionado.licencias.map(lic => (
                                    <div key={lic.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="checkbox" 
                                                checked={formReasignar.licencias_ids.includes(lic.id)}
                                                onChange={(e) => {
                                                    const ids = e.target.checked 
                                                        ? [...formReasignar.licencias_ids, lic.id]
                                                        : formReasignar.licencias_ids.filter(id => id !== lic.id);
                                                    setFormReasignar({...formReasignar, licencias_ids: ids});
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-bold text-slate-700">{lic.nombre}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lic.tipo}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[9px] text-slate-400 italic">* Las licencias no seleccionadas serán liberadas automáticamente.</p>
                        </div>
                      )}

                      <FormInput label="Notas de entrega" value={formReasignar.notas} onChange={v => setFormReasignar({...formReasignar, notas: v})} />
                      
                      <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                        Confirmar Reasignación
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL RESGUARDO (PDF PREVIEW) */}
      {mostrarModalResguardo && activoSeleccionado && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 print:p-0">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none overflow-hidden">
                <div className="p-5 border-b flex justify-between items-center bg-slate-50 print:hidden">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Resguardo Digital de Equipo</h3>
                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"><i className="pi pi-print"></i> IMPRIMIR PDF</button>
                        <button onClick={() => setMostrarModalResguardo(false)} className="text-slate-400 hover:text-red-500">✕</button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-12 bg-white text-slate-800 leading-relaxed font-serif text-sm">
                    {/* Header Documento */}
                    <div className="flex justify-between items-center border-b-2 border-slate-800 pb-8 mb-8">
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-slate-900">GNN DESK ITAM</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Resguardo de Equipamiento y Herramientas</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold">GNN S.A. DE C.V.</p>
                            <p className="text-xs text-slate-500">Sistemas y Tecnologías de Información</p>
                        </div>
                    </div>

                    <p className="mb-6">Ciudad de México, a {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
                    
                    <p className="mb-8">Por medio de la presente, yo <span className="font-black border-b border-slate-300 px-2">{activoSeleccionado.asignado_a}</span>, identificado con el cargo de colaborador, manifiesto recibir de conformidad el equipo de cómputo y/o periféricos que se detallan a continuación, propiedad de <span className="font-black uppercase tracking-tight">GNN S.A. DE C.V.</span>, para el desempeño exclusivo de mis funciones laborales.</p>

                    <table className="w-full border-2 border-slate-800 mb-8">
                        <thead className="bg-slate-100 border-b-2 border-slate-800">
                            <tr>
                                <th className="p-3 text-left font-black text-[10px] uppercase">Categoría</th>
                                <th className="p-3 text-left font-black text-[10px] uppercase">Marca / Modelo</th>
                                <th className="p-3 text-left font-black text-[10px] uppercase">N° Serie / ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 font-sans">
                            <tr>
                                <td className="p-3 font-bold text-xs">{activoSeleccionado.categoria}</td>
                                <td className="p-3 font-bold text-xs">{activoSeleccionado.marca_nombre} {activoSeleccionado.modelo}</td>
                                <td className="p-3 font-mono text-xs">{activoSeleccionado.serie}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="space-y-4 mb-12">
                        <h4 className="font-black text-xs uppercase tracking-widest">CLAUSULADO DE RESPONSABILIDAD:</h4>
                        <p className="text-xs italic">1. El usuario se compromete a mantener el equipo en óptimas condiciones y reportar cualquier falla de inmediato al departamento de TI.</p>
                        <p className="text-xs italic">2. Queda estrictamente prohibido el uso de los equipos para fines personales, la instalación de software no autorizado o la alteración física de los componentes.</p>
                        <p className="text-xs italic">3. En caso de terminación laboral, el equipo deberá ser entregado en las mismas condiciones en que se recibió.</p>
                    </div>

                    <div className="flex justify-around items-end pt-20">
                        <div className="text-center border-t-2 border-slate-300 pt-2 w-64">
                            <p className="font-black text-xs uppercase">Dirección de Sistemas</p>
                            <p className="text-[10px] text-slate-400">Emisor y Validador</p>
                        </div>
                        <div className="text-center w-64 group relative">
                            {firmaDigital ? (
                                <img src={firmaDigital} alt="Firma" className="h-24 mx-auto mix-blend-multiply mb-1" />
                            ) : (
                                <button onClick={() => setMostrarModalFirma(true)} className="mb-4 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black hover:border-blue-500 hover:text-blue-500 transition-all print:hidden">CLICK PARA FIRMAR AQUÍ</button>
                            )}
                            <div className="border-t-2 border-slate-800 pt-2">
                                <p className="font-black text-xs uppercase">{activoSeleccionado.asignado_a}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Colaborador / Receptor</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* MODAL PAD DE FIRMA */}
      {mostrarModalFirma && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden w-full max-lg">
                  <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Firma Digital Autógrafa</h3>
                      <button onClick={() => setMostrarModalFirma(false)} className="text-slate-400">✕</button>
                  </div>
                  <div className="p-8">
                      <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} width={450} height={200} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl cursor-crosshair shadow-inner" />
                      <div className="flex gap-3 mt-6">
                          <button onClick={limpiarFirma} className="flex-1 border-2 border-slate-100 py-3 rounded-xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-all">LIMPIAR PAD</button>
                          <button onClick={guardarFirma} className="flex-[2] bg-blue-600 text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-blue-100 hover:scale-105 transition-all">GUARDAR FIRMA</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL BITÁCORA (MANTENIMIENTO ESTRUCTURADO) */}
      {mostrarModalBitacora && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b flex justify-between bg-slate-50 items-center">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Nueva Entrada de Bitácora</h3>
                      <button onClick={() => setMostrarModalBitacora(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                  </div>

                  <form onSubmit={handleRegistrarBitacora} className="p-8 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de Servicio</label>
                            <select value={formBitacora.tipo} onChange={e => setFormBitacora({...formBitacora, tipo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all">
                                <option value="Preventivo">Preventivo</option>
                                <option value="Correctivo">Correctivo</option>
                                <option value="Mejora">Mejora / Upgrade</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha de Ejecución</label>
                            <input type="date" value={formBitacora.fecha} onChange={e => setFormBitacora({...formBitacora, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descripción Técnica</label>
                        <textarea required placeholder="Tareas realizadas..." rows="3" value={formBitacora.descripcion} onChange={e => setFormBitacora({...formBitacora, descripcion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none shadow-inner" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inversión / Costo (MXN)</label>
                        <input type="number" step="0.01" value={formBitacora.costo} onChange={e => setFormBitacora({...formBitacora, costo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-inner" />
                      </div>
                      
                      <div className="pt-2">
                        <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Guardar en Historial
                        </button>
                        <p className="text-center text-[9px] text-slate-400 font-bold uppercase mt-4 italic tracking-wider">Actualizará automáticamente la salud del activo</p>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL BAJA ESPECIALIZADA */}
      {mostrarModalBaja && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                  <div className="p-6 border-b flex justify-between bg-slate-50 items-center">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Proceso de Baja de Activo</h3>
                      <button onClick={() => setMostrarModalBaja(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                  </div>

                  <form onSubmit={handleBaja} className="p-8 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Motivo de la Baja</label>
                        <select value={formBaja.motivo} onChange={e => setFormBaja({...formBaja, motivo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-red-500 transition-all">
                            <option value="Robo">Baja por Robo</option>
                            <option value="Venta">Baja por Venta</option>
                            <option value="Obsolescencia">Baja por Obsolescencia</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Notas Adicionales</label>
                        <textarea placeholder="Detalles sobre la baja..." rows="2" value={formBaja.notas} onChange={e => setFormBaja({...formBaja, notas: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-red-500 transition-all resize-none shadow-inner" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {formBaja.motivo === 'Robo' ? 'Denuncia (PDF) *' : formBaja.motivo === 'Venta' ? 'Factura (PDF) *' : 'Dictamen / Otros (PDF)'}
                        </label>
                        <input 
                            type="file" 
                            accept=".pdf" 
                            multiple
                            onChange={(e) => setFormBaja({...formBaja, archivos: Array.from(e.target.files)})}
                            className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                            Confirmar Baja del Activo
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* MODAL BAJA DEFINITIVA LOTE (PDF PREVIEW) */}
      {mostrarModalBajaDefinitiva && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 print:p-0">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col print:max-h-none print:shadow-none print:rounded-none overflow-hidden">
                  <div className="p-5 border-b flex justify-between items-center bg-slate-50 print:hidden">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm text-red-600 flex items-center gap-2">
                          <i className="pi pi-exclamation-triangle"></i> Acta de Baja Definitiva de Activos
                      </h3>
                      <div className="flex gap-3">
                          <button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"><i className="pi pi-print"></i> IMPRIMIR ACTA</button>
                          <button onClick={handleBajaDefinitiva} className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">APLICAR BAJA SISTEMA</button>
                          <button onClick={() => setMostrarModalBajaDefinitiva(false)} className="text-slate-400 hover:text-red-500">✕</button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-12 bg-white text-slate-800 leading-relaxed font-serif text-sm">
                      {/* Header Acta */}
                      <div className="text-center border-b-2 border-slate-800 pb-8 mb-8">
                          <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Acta de Baja Definitiva por Obsolescencia</h1>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">Inventario GNN Desk ITAM</p>
                      </div>

                      <p className="mb-6">Ciudad de México, a {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
                      
                      <p className="mb-8">Se hace constar que los siguientes activos, propiedad de <span className="font-black uppercase tracking-tight">GNN S.A. DE C.V.</span>, han cumplido su ciclo de vida útil o presentan un grado de obsolescencia técnica que no permite su continuidad operativa, por lo que se procede a su BAJA DEFINITIVA del inventario institucional.</p>

                      <table className="w-full border-2 border-slate-800 mb-12">
                          <thead className="bg-slate-100 border-b-2 border-slate-800">
                              <tr className="text-[10px] font-black uppercase tracking-wider">
                                  <th className="p-3 border-r-2 border-slate-800 text-left">Código / Serie</th>
                                  <th className="p-3 border-r-2 border-slate-800 text-left">Marca / Modelo</th>
                                  <th className="p-3 text-left">Última Asignación</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-300 font-sans">
                              {activos.filter(a => idsSeleccionados.includes(a.id)).map(a => (
                                  <tr key={a.id} className="text-xs">
                                      <td className="p-3 border-r border-slate-300 font-bold">{a.codigo}<br/><span className="text-[10px] text-slate-500 font-mono">{a.serie || 'S/N'}</span></td>
                                      <td className="p-3 border-r border-slate-300">{a.marca_nombre} {a.modelo}</td>
                                      <td className="p-3">{a.asignado_a}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      <div className="grid grid-cols-2 gap-20 pt-20 mt-12">
                          <div className="text-center border-t-2 border-slate-800 pt-3">
                              <p className="font-black text-xs uppercase">Dirección de Auditoría</p>
                              <p className="text-[10px] text-slate-500 mt-1 italic">Nombre y Firma</p>
                          </div>
                          <div className="text-center border-t-2 border-slate-800 pt-3">
                              <p className="font-black text-xs uppercase">Gestión de Medio Ambiente</p>
                              <p className="text-[10px] text-slate-500 mt-1 italic">Nombre y Firma</p>
                          </div>
                          <div className="text-center border-t-2 border-slate-800 pt-3 col-span-2 w-1/2 mx-auto mt-10">
                              <p className="font-black text-xs uppercase">Responsable de Tecnologías (GNN)</p>
                              <p className="text-[10px] text-slate-500 mt-1 italic">Nombre y Firma</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL CATÁLOGOS */}
      {mostrarModalCatalogos && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex h-[600px]">
                  {/* Sidebar Modal */}
                  <div className="w-64 bg-slate-50 border-r border-slate-200 p-8">
                      <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs mb-8">Administrar</h3>
                      <div className="space-y-2">
                          {[
                            {id: 'marca', label: 'Marcas', icon: 'pi-tag'},
                            {id: 'proveedor', label: 'Proveedores', icon: 'pi-truck'},
                            {id: 'modelo_parte', label: 'Modelos por N° Parte', icon: 'pi-database'}
                          ].map(t => (
                              <button key={t.id} onClick={() => setFormNuevoCatalogo({...formNuevoCatalogo, tipo: t.id})} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${formNuevoCatalogo.tipo === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 hover:bg-slate-100'}`}>
                                  <i className={`pi ${t.icon}`}></i> {t.label}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* Content Modal */}
                  <div className="flex-1 flex flex-col">
                      <div className="p-6 border-b flex justify-between items-center">
                          <h4 className="font-bold text-slate-800">Listado de {formNuevoCatalogo.tipo === 'marca' ? 'Marcas' : formNuevoCatalogo.tipo === 'proveedor' ? 'Proveedores' : 'Modelos por N° Parte'}</h4>
                          <button onClick={() => setMostrarModalCatalogos(false)}>✕</button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar-light">
                          <div className="grid grid-cols-1 gap-4">
                              {(formNuevoCatalogo.tipo === 'marca' ? catalogoMarcas : formNuevoCatalogo.tipo === 'proveedor' ? catalogoProveedores : catalogoModelosParte).map(item => (
                                  <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                                      <div>
                                          <p className="font-black text-slate-800 text-sm">{item.numero_parte ? `${item.numero_parte} - ${item.nombre}` : item.nombre}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase">{item.descripcion || item.tipo || 'Sin descripción'}</p>
                                      </div>
                                      {isAdmin && (
                                          <button 
                                              onClick={async () => {
                                                  if(!window.confirm("¿Eliminar este elemento?")) return;
                                                  const url = formNuevoCatalogo.tipo === 'marca' ? 'marcas' : formNuevoCatalogo.tipo === 'proveedor' ? 'proveedores' : 'modelos-parte';
                                                  await clienteAxios.delete(`/catalogos/${url}/${item.id}`);
                                                  cargarCatalogos();
                                              }}
                                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all"
                                          >
                                              <i className="pi pi-trash"></i>
                                          </button>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Footer Modal (Add Form) */}
                      {isAdmin && (
                          <form onSubmit={async (e) => {
                                e.preventDefault();
                                const url = formNuevoCatalogo.tipo === 'marca' ? 'marcas' : formNuevoCatalogo.tipo === 'proveedor' ? 'proveedores' : 'modelos-parte';
                                try {
                                    const payload = formNuevoCatalogo.tipo === 'modelo_parte' ? {
                                        numero_parte: formNuevoCatalogo.numero_parte,
                                        nombre: formNuevoCatalogo.nombre,
                                        descripcion: formNuevoCatalogo.descripcion,
                                        tipo: formNuevoCatalogo.tipo_dev,
                                        ram: formNuevoCatalogo.ram,
                                        cpu: formNuevoCatalogo.cpu,
                                        almacenamiento: formNuevoCatalogo.almacenamiento,
                                        pulgadas: formNuevoCatalogo.pulgadas,
                                        rma: formNuevoCatalogo.rma,
                                        especificaciones_json: formNuevoCatalogo.atributos || {}
                                    } : {
                                        nombre: formNuevoCatalogo.nombre,
                                        descripcion: formNuevoCatalogo.descripcion,
                                        rfc: formNuevoCatalogo.rfc
                                    };
                                    await clienteAxios.post(`/catalogos/${url}`, payload);
                                    alert("Registrado correctamente");
                                    cargarCatalogos();
                                    setFormNuevoCatalogo({ ...formNuevoCatalogo, nombre: '', descripcion: '', rfc: '', numero_parte: '', ram: '', cpu: '', almacenamiento: '', pulgadas: '', rma: '', atributos: {} });
                                } catch (err) { alert("Error al registrar"); }
                          }} className="p-6 bg-slate-50 border-t flex flex-col gap-4">
                              {formNuevoCatalogo.tipo === 'modelo_parte' ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">N° Parte</label>
                                            <input required placeholder="Ej: 20W0004XLM" value={formNuevoCatalogo.numero_parte || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, numero_parte: e.target.value})} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-blue-500 shadow-sm" />
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombre Comercial / Modelo</label>
                                            <input required placeholder="Ej: ThinkPad L14 Gen 2" value={formNuevoCatalogo.nombre || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, nombre: e.target.value})} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs outline-none focus:border-blue-500 shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Procesador</label>
                                            <input placeholder="i7-1165G7" value={formNuevoCatalogo.cpu || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, cpu: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">RAM</label>
                                            <input placeholder="16GB" value={formNuevoCatalogo.ram || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, ram: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">SSD/HDD</label>
                                            <input placeholder="512GB" value={formNuevoCatalogo.almacenamiento || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, almacenamiento: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">RMA/Soporte</label>
                                            <input placeholder="Premier" value={formNuevoCatalogo.rma || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, rma: e.target.value})} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs outline-none" />
                                        </div>
                                    </div>
                                    
                                    {/* ATRIBUTOS DINÁMICOS (Impresoras, Teclados, etc) */}
                                    <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Características Especiales (DPI, Toner, Resolución, etc)</p>
                                        <div className="flex gap-2">
                                            <input id="key-attr" placeholder="Característica" className="flex-1 bg-slate-50 border border-slate-100 p-2 rounded-lg text-[10px] outline-none" />
                                            <input id="val-attr" placeholder="Valor" className="flex-1 bg-slate-50 border border-slate-100 p-2 rounded-lg text-[10px] outline-none" />
                                            <button type="button" onClick={() => {
                                                const k = document.getElementById('key-attr').value;
                                                const v = document.getElementById('val-attr').value;
                                                if(!k || !v) return;
                                                setFormNuevoCatalogo({...formNuevoCatalogo, atributos: {...(formNuevoCatalogo.atributos || {}), [k]: v}});
                                                document.getElementById('key-attr').value = '';
                                                document.getElementById('val-attr').value = '';
                                            }} className="bg-slate-800 text-white px-3 rounded-lg text-[10px] font-bold">AGREGAR</button>
                                        </div>
                                        {Object.keys(formNuevoCatalogo.atributos || {}).length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {Object.entries(formNuevoCatalogo.atributos).map(([k, v]) => (
                                                    <span key={k} className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-2">
                                                        {k}: {v}
                                                        <button type="button" onClick={() => {
                                                            const newAttr = {...formNuevoCatalogo.atributos};
                                                            delete newAttr[k];
                                                            setFormNuevoCatalogo({...formNuevoCatalogo, atributos: newAttr});
                                                        }} className="text-blue-300 hover:text-blue-500">✕</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombre</label>
                                        <input required placeholder="Nombre" value={formNuevoCatalogo.nombre || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, nombre: e.target.value})} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                    {formNuevoCatalogo.tipo === 'proveedor' && (
                                        <div className="w-40 space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">RFC</label>
                                            <input placeholder="RFC" value={formNuevoCatalogo.rfc || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, rfc: e.target.value})} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-blue-500 shadow-sm" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Descripción</label>
                                        <input placeholder="Descripción" value={formNuevoCatalogo.descripcion || ''} onChange={e => setFormNuevoCatalogo({...formNuevoCatalogo, descripcion: e.target.value})} className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs outline-none focus:border-blue-500 shadow-sm" />
                                    </div>
                                </div>
                              )}
                              <button className="w-full bg-blue-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 hover:scale-[1.01] active:scale-[0.99]">
                                Guardar en {formNuevoCatalogo.tipo === 'marca' ? 'Marcas' : formNuevoCatalogo.tipo === 'proveedor' ? 'Proveedores' : 'Catálogo de Partes'}
                              </button>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* CSS ANIMATIONS & PRINT */}
      <style>{`
        @media print {
            body * { visibility: hidden; }
            .fixed.z-\\[120\\] { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; z-index: 9999; }
            .fixed.z-\\[120\\] * { visibility: visible; }
            .fixed.z-\\[120\\] .print\\:hidden { display: none !important; }
        }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Inventario;