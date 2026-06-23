import React, { useState, useEffect, useRef } from 'react';
import Pagination from '../components/Pagination';
import clienteAxios from '../api/axios';

const Licencias = ({ user, token }) => {
    // --- PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);
    // --- ESTADOS PRINCIPALES ---
    const [licencias, setLicencias] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [cargando, setCargando] = useState(true);

    // --- ESTADOS DE LA UI ---
    const [busqueda, setBusqueda] = useState('');
    const [busquedaUsuarioLink, setBusquedaUsuarioLink] = useState(''); // ✅ Buscador de usuarios
    const [usuarioVincular, setUsuarioVincular] = useState(null); // ✅ Usuario seleccionado para vincular
    const [filtroCategoria, setFiltroCategoria] = useState('Todas');
    const [mostrarEliminadas, setMostrarEliminadas] = useState(false);
    const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);

    // Modales
    const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [mostrarModalRenovar, setMostrarModalRenovar] = useState(false);
    const [pestañaDetalle, setPestañaDetalle] = useState('info');

    // Formularios
    const [formLicencia, setFormLicencia] = useState({ 
        nombre: '', 
        categoria: 'Software', 
        proveedor_texto: '', 
        proveedor_id: '',
        costo_anual: '', 
        fecha_compra: '', 
        fecha_vencimiento: '', 
        asientos_totales: 1, 
        llave: '' 
    });
    const [formRenovacion, setFormRenovacion] = useState({ nueva_fecha: '', costo: '', notas: '' });
    const fileInputRef = useRef(null);

    const isAdmin = user?.rol === 'Admin';
    const isTecnico = user?.rol === 'Tecnico';
    const puedeEditar = isAdmin || isTecnico;

    // ==========================================
    // CONEXIÓN AL BACKEND
    // ==========================================

    const fetchLicencias = async () => {
        setCargando(true);
        try {
            const response = await clienteAxios.get('/licencias/');
            setLicencias(response.data);
            if (licenciaSeleccionada) {
                const actualizada = response.data.find(l => l.id === licenciaSeleccionada.id);
                if (actualizada) setLicenciaSeleccionada(actualizada);
            }
        } catch (error) {
            console.error("Error al cargar licencias:", error);
        } finally {
            setCargando(false);
        }
    };

    const fetchUsuarios = async () => {
        try {
            const response = await clienteAxios.get('/usuarios/');
            setUsuarios(response.data);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
        }
    };

    const fetchProveedores = async () => {
        try {
            const response = await clienteAxios.get('/catalogos/proveedores');
            setProveedores(response.data);
        } catch (error) {
            console.error("Error al cargar proveedores:", error);
        }
    };

    useEffect(() => {
        fetchLicencias();
        fetchUsuarios();
        fetchProveedores();
    }, []);

    const handleAltaLicencia = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formLicencia,
                costo_anual: Number(formLicencia.costo_anual),
                asientos_totales: Number(formLicencia.asientos_totales),
                proveedor_id: formLicencia.proveedor_id ? Number(formLicencia.proveedor_id) : null
            };
            await clienteAxios.post('/licencias/', payload);
            fetchLicencias();
            setMostrarModalAlta(false);
            resetForm();
        } catch (error) {
            alert("Error al registrar licencia.");
        }
    };

    const handleEditarLicencia = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formLicencia,
                costo_anual: Number(formLicencia.costo_anual),
                asientos_totales: Number(formLicencia.asientos_totales),
                proveedor_id: formLicencia.proveedor_id ? Number(formLicencia.proveedor_id) : null
            };
            await clienteAxios.put(`/licencias/${licenciaSeleccionada.id}`, payload);
            fetchLicencias();
            setMostrarModalEditar(false);
            resetForm();
        } catch (error) {
            alert("Error al actualizar.");
        }
    };

    const handleEliminar = async () => {
        const confirmMsg = licenciaSeleccionada.is_deleted 
            ? "¿Eliminar permanentemente esta licencia?" 
            : "¿Dar de baja esta licencia? Esto liberará los activos vinculados.";
        
        if (!window.confirm(confirmMsg)) return;

        try {
            await clienteAxios.delete(`/licencias/${licenciaSeleccionada.id}`);
            setLicenciaSeleccionada(null);
            fetchLicencias();
            fetchActivos();
        } catch (error) {
            alert("Error al eliminar.");
        }
    };

    const handleRestaurar = async () => {
        try {
            await clienteAxios.patch(`/licencias/${licenciaSeleccionada.id}/restaurar`);
            fetchLicencias();
        } catch (error) {
            alert("Error al restaurar.");
        }
    };

    const handleRenovar = async (e) => {
        e.preventDefault();
        try {
            const hist = {
                fecha: new Date().toISOString(),
                evento: "Renovación de Suscripción",
                usuario: user.nombre_completo,
                notas: formRenovacion.notas || "Renovación estándar"
            };
            await clienteAxios.put(`/licencias/${licenciaSeleccionada.id}`, {
                fecha_vencimiento: formRenovacion.nueva_fecha,
                costo_anual: Number(formRenovacion.costo),
                historial: [hist]
            });
            fetchLicencias();
            setMostrarModalRenovar(false);
            setFormRenovacion({ nueva_fecha: '', costo: '', notas: '' });
        } catch (error) {
            alert("Error al renovar.");
        }
    };

    const handleExportarExcel = async () => {
        try {
            const response = await clienteAxios.get('/licencias/export/excel', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `licencias_gnn_${new Date().toISOString().split('T')[0]}.xlsx`);
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
            const res = await clienteAxios.post('/licencias/import/excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.errores.length > 0) {
                alert(`Importación completada con ${res.data.importados} licencias. Errores: \n${res.data.errores.join('\n')}`);
            } else {
                alert(`¡Éxito! Se importaron ${res.data.importados} licencias.`);
            }
            fetchLicencias();
        } catch (err) {
            alert(err.response?.data?.detail || "Error al importar Excel");
        } finally {
            e.target.value = ''; // Limpiar input
        }
    };

    const vincularUsuario = async (uId) => {
        try {
            await clienteAxios.post(`/licencias/${licenciaSeleccionada.id}/vincular-usuario/${uId}`);
            fetchLicencias();
            setBusquedaUsuarioLink('');
        } catch (error) {
            alert(error.response?.data?.detail || "Error al vincular.");
        }
    };

    const desvincularUsuario = async (uId) => {
        if (!window.confirm("¿Desvincular esta licencia del usuario?")) return;
        try {
            await clienteAxios.post(`/licencias/${licenciaSeleccionada.id}/desvincular-usuario/${uId}`);
            fetchLicencias();
        } catch (error) {
            alert("Error al desvincular.");
        }
    };

    const handleSubirDocumento = async (e) => {
        const files = e.target.files;
        if (!files.length) return;
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) formData.append('files', files[i]);
        try {
            await clienteAxios.post(`/licencias/${licenciaSeleccionada.id}/documentos`, formData);
            fetchLicencias();
        } catch (error) {
            alert("Error al subir documentos.");
        }
    };

    const resetForm = () => {
        setFormLicencia({ nombre: '', categoria: 'Software', proveedor_texto: '', proveedor_id: '', costo_anual: '', fecha_compra: '', fecha_vencimiento: '', asientos_totales: 1, llave: '' });
    };

    const openEditModal = () => {
        setFormLicencia({
            nombre: licenciaSeleccionada.nombre,
            categoria: licenciaSeleccionada.categoria,
            proveedor_texto: licenciaSeleccionada.proveedor_texto || '',
            proveedor_id: licenciaSeleccionada.proveedor_id || '',
            costo_anual: licenciaSeleccionada.costo_anual,
            fecha_compra: licenciaSeleccionada.fecha_compra,
            fecha_vencimiento: licenciaSeleccionada.fecha_vencimiento,
            asientos_totales: licenciaSeleccionada.asientos_totales,
            llave: licenciaSeleccionada.llave || ''
        });
        setMostrarModalEditar(true);
    };

    // ==========================================
    // HELPERS Y FILTROS
    // ==========================================
    const formatoMoneda = (m) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(m || 0);
    const formatFecha = (iso) => iso ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    const getEstado = (lic) => {
        if (lic.is_deleted) return { label: 'Baja', css: 'bg-slate-50 text-slate-500 border-slate-200' };
        if (!lic.fecha_vencimiento) return { label: 'Vigente', css: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        const venc = new Date(lic.fecha_vencimiento);
        const hoy = new Date();
        const diff = (venc - hoy) / (1000 * 3600 * 24);
        if (diff < 0) return { label: 'Expirada', css: 'bg-red-50 text-red-700 border-red-200' };
        if (diff <= 30) return { label: 'Por Vencer', css: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { label: 'Vigente', css: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    };

    const filtered = licencias.filter(l => {
        const matchesSearch = l.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (l.proveedor?.nombre || l.proveedor_texto || '').toLowerCase().includes(busqueda.toLowerCase());
        const matchesCat = filtroCategoria === 'Todas' || l.categoria === filtroCategoria;
        const matchesDel = mostrarEliminadas ? l.is_deleted : !l.is_deleted;
        return matchesSearch && matchesCat && matchesDel;
    });

    const filteredUsers = usuarios.filter(u => 
        u.nombre_completo.toLowerCase().includes(busquedaUsuarioLink.toLowerCase()) || 
        u.email.toLowerCase().includes(busquedaUsuarioLink.toLowerCase())
    );

    const paginated = filtered.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Licencias (SAM)</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Control de activos de software y suscripciones digitales.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 mr-2">
                        <button onClick={() => setMostrarEliminadas(false)} className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition ${!mostrarEliminadas ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Activas</button>
                        <button onClick={() => setMostrarEliminadas(true)} className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition ${mostrarEliminadas ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Papelera</button>
                    </div>
                    {puedeEditar && (
                        <div className="flex flex-wrap items-center gap-2">
                            {isAdmin && (
                                <>
                                    <button onClick={handleExportarExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                                        <i className="pi pi-file-excel text-xs"></i> Exportar
                                    </button>
                                    <button onClick={() => document.getElementById('import-excel-licencias').click()} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                                        <i className="pi pi-upload text-xs"></i> Importar
                                    </button>
                                    <input type="file" id="import-excel-licencias" className="hidden" accept=".xlsx, .xls" onChange={handleImportarExcel} />
                                </>
                            )}
                            <button onClick={() => setMostrarModalAlta(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
                                <i className="pi pi-plus text-xs"></i> Nueva Licencia
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* FILTROS Y BUSQUEDA */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 w-full print:hidden">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" placeholder="Buscar por nombre o proveedor..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded shadow-sm pl-9 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar-light pb-2 md:pb-0">
                    {['Todas', 'Software', 'Dominio Web', 'Certificado SSL', 'Hosting/Nube'].map(cat => (
                        <button key={cat} onClick={() => setFiltroCategoria(cat)}
                            className={`px-4 py-2 rounded font-semibold text-xs whitespace-nowrap transition-colors shadow-sm ${filtroCategoria === cat ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'}`}>
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
                                <th className="p-4 pl-6">Software / Servicio</th>
                                <th className="p-4">Proveedor</th>
                                <th className="p-4">Asientos</th>
                                <th className="p-4">Vencimiento</th>
                                <th className="p-4 text-right pr-6">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {cargando ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-bold">Sincronizando licencias...</td></tr>
                            ) : paginated.map(l => {
                                const st = getEstado(l);
                                return (
                                    <tr key={l.id} className="hover:bg-blue-50/50 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <p className="font-bold text-slate-800">{l.nombre}</p>
                                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{l.categoria}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-slate-700 font-semibold">{l.proveedor?.nombre || l.proveedor_texto || 'N/A'}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                    <div className="bg-blue-500 h-full" style={{ width: `${((l.usuarios?.length || 0) / l.asientos_totales) * 100}%` }}></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-600">{l.usuarios?.length || 0} / {l.asientos_totales}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-slate-700 font-semibold">{formatFecha(l.fecha_vencimiento)}</p>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider mt-1 inline-block ${st.css}`}>{st.label}</span>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <button onClick={() => { setLicenciaSeleccionada(l); setPestañaDetalle('info'); }} className="text-blue-600 font-semibold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors">Detalles</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <Pagination totalItems={filtered.length} itemsPerPage={itemsPorPagina} currentPage={paginaActual} onPageChange={setPaginaActual} onItemsPerPageChange={setItemsPorPagina} />
            </div>

            {/* DRAWER DETALLES */}
            {licenciaSeleccionada && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity print:hidden">
                    <div className="w-full md:w-[450px] bg-white border-l border-slate-200 p-8 animate-slide-in-right shadow-2xl flex flex-col h-full">
                        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <i className="pi pi-shield text-slate-400"></i>
                                Expediente SAM
                            </h2>
                            <button onClick={() => setLicenciaSeleccionada(null)} className="text-slate-400 hover:bg-slate-100 p-2 rounded transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar-light pr-2">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 relative shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-4">Servicio / Suscripción</p>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg shadow-sm">
                                        {licenciaSeleccionada.nombre.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-800 pr-4">{licenciaSeleccionada.nombre}</p>
                                        <p className="text-blue-600 font-medium text-sm">{licenciaSeleccionada.categoria}</p>
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-slate-200 flex gap-2 flex-wrap">
                                    <span className={`px-2.5 py-1 rounded text-[10px] font-black border uppercase tracking-wider ${getEstado(licenciaSeleccionada).css}`}>{getEstado(licenciaSeleccionada).label}</span>
                                    <span className="px-2.5 py-1 rounded text-[10px] font-black border uppercase tracking-wider bg-white text-slate-600 border-slate-200">ID: #{licenciaSeleccionada.id}</span>
                                </div>
                            </div>

                            {/* ACCIONES RÁPIDAS */}
                            {puedeEditar && (
                                <div className="grid grid-cols-3 gap-2">
                                    {!licenciaSeleccionada.is_deleted && (
                                        <>
                                            <button onClick={openEditModal} className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-blue-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                                                <i className="pi pi-pencil text-blue-500 text-sm"></i> EDITAR
                                            </button>
                                            <button onClick={() => setMostrarModalRenovar(true)} className="flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-emerald-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm">
                                                <i className="pi pi-refresh text-emerald-500 text-sm"></i> RENOVAR
                                            </button>
                                        </>
                                    )}
                                    <button onClick={handleEliminar} className={`flex flex-col items-center justify-center gap-1 bg-white border border-slate-200 hover:bg-red-50 text-slate-600 p-2 rounded-lg text-[9px] font-bold transition-all shadow-sm ${licenciaSeleccionada.is_deleted ? 'col-span-3' : ''}`}>
                                        <i className="pi pi-trash text-red-500 text-sm"></i> {licenciaSeleccionada.is_deleted ? 'ELIMINAR PERMANENTE' : 'BAJA'}
                                    </button>
                                </div>
                            )}

                            {/* TABS */}
                            <div className="flex gap-4 border-b border-slate-100">
                                {['info', 'asignacion', 'docs', 'log'].map(t => (
                                    <button key={t} onClick={() => setPestañaDetalle(t)} className={`pb-2 text-[10px] font-black uppercase tracking-wider transition-colors border-b-2 ${pestañaDetalle === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                                        {t === 'info' ? 'Contrato' : t === 'asignacion' ? 'Usuarios' : t === 'docs' ? 'Archivos' : 'Historial'}
                                    </button>
                                ))}
                            </div>

                            {pestañaDetalle === 'info' && (
                                <div className="space-y-4">
                                    <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
                                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold uppercase text-[10px]">Proveedor:</span> <span className="font-bold text-slate-700">{licenciaSeleccionada.proveedor?.nombre || licenciaSeleccionada.proveedor_texto || 'N/A'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold uppercase text-[10px]">Costo Anual:</span> <span className="font-black text-slate-800">{formatoMoneda(licenciaSeleccionada.costo_anual)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold uppercase text-[10px]">Fecha de Compra:</span> <span className="font-bold text-slate-700">{formatFecha(licenciaSeleccionada.fecha_compra)}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500 font-bold uppercase text-[10px]">Vencimiento:</span> <span className="font-bold text-slate-700">{formatFecha(licenciaSeleccionada.fecha_vencimiento)}</span></div>
                                    </div>
                                    
                                    {licenciaSeleccionada.documentos?.length > 0 && (
                                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                            <p className="text-[10px] font-black text-blue-600 uppercase mb-2">Documentos Adjuntos ({licenciaSeleccionada.documentos.length})</p>
                                            <div className="flex flex-wrap gap-2">
                                                {licenciaSeleccionada.documentos.map((doc, idx) => (
                                                    <a key={idx} href={`http://localhost:8000/${doc}`} target="_blank" rel="noopener noreferrer" className="bg-white border border-blue-200 p-2 rounded-lg text-[9px] font-bold text-blue-700 flex items-center gap-2 hover:bg-blue-100 transition shadow-sm">
                                                        <i className="pi pi-file-pdf"></i> VER DOC {idx + 1}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl shadow-inner">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Llave / Licenciamiento</p>
                                        <p className="text-xs font-mono text-slate-700 break-all bg-white p-3 rounded border border-slate-200">{licenciaSeleccionada.llave || 'Sin llave registrada'}</p>
                                    </div>
                                </div>
                            )}

                            {pestañaDetalle === 'asignacion' && (
                                <div className="space-y-4">
                                    {puedeEditar && !licenciaSeleccionada.is_deleted && (
                                        <div className="space-y-2 relative">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Vincular Usuario</p>
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder="Buscar por nombre o email..." 
                                                    value={busquedaUsuarioLink} 
                                                    onChange={e => { setBusquedaUsuarioLink(e.target.value); setUsuarioVincular(null); }}
                                                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500"
                                                />
                                                {busquedaUsuarioLink.length > 0 && !usuarioVincular && (
                                                    <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl mt-1 z-20 overflow-hidden max-h-48 overflow-y-auto">
                                                        {filteredUsers.map(u => (
                                                            <button 
                                                                key={u.id} 
                                                                onClick={() => { setUsuarioVincular(u); setBusquedaUsuarioLink(u.nombre_completo); }}
                                                                className="w-full text-left p-4 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex flex-col"
                                                            >
                                                                <span className="text-sm font-black text-slate-800">{u.nombre_completo}</span>
                                                                <span className="text-xs text-slate-500">{u.email}</span>
                                                            </button>
                                                        ))}
                                                        {filteredUsers.length === 0 && <p className="p-4 text-xs font-bold text-slate-400 uppercase italic">No se encontraron usuarios</p>}
                                                    </div>
                                                )}
                                            </div>

                                            {usuarioVincular && (
                                                <div className="mt-4 p-5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between animate-fadeIn">
                                                    <div>
                                                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Usuario Seleccionado</p>
                                                        <p className="text-base font-bold text-slate-800">{usuarioVincular.nombre_completo}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setUsuarioVincular(null)} className="p-2 text-slate-400 hover:text-slate-600 transition"><i className="pi pi-times"></i></button>
                                                        <button onClick={() => { vincularUsuario(usuarioVincular.id); setUsuarioVincular(null); }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-blue-100 hover:bg-blue-700 transition">Asignar</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Asientos Ocupados ({licenciaSeleccionada.usuarios?.length || 0})</p>
                                        {(licenciaSeleccionada.usuarios || []).map(u => (
                                            <div key={u.id} className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center group shadow-sm">
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{u.nombre_completo}</p>
                                                    <p className="text-[10px] text-blue-600 font-bold">{u.email}</p>
                                                </div>
                                                {puedeEditar && (
                                                    <button onClick={() => desvincularUsuario(u.id)} className="text-red-500 opacity-0 group-hover:opacity-100 p-2 transition hover:bg-red-50 rounded-lg flex items-center gap-2 text-[10px] font-bold">
                                                        <i className="pi pi-user-minus"></i> LIBERAR
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {(!licenciaSeleccionada.usuarios || licenciaSeleccionada.usuarios.length === 0) && <p className="text-xs text-slate-400 text-center py-6 italic font-medium">Sin usuarios vinculados</p>}
                                    </div>
                                </div>
                            )}

                            {pestañaDetalle === 'docs' && (
                                <div className="space-y-4">
                                    {puedeEditar && (
                                        <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center hover:border-blue-300 transition-colors cursor-pointer" onClick={() => fileInputRef.current.click()}>
                                            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleSubirDocumento} />
                                            <i className="pi pi-upload text-slate-300 text-xl mb-2"></i>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Subir Documentación PDF</p>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {licenciaSeleccionada.documentos.map((doc, idx) => (
                                            <a key={idx} href={`http://localhost:8000/${doc}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <i className="pi pi-file-pdf text-red-500"></i>
                                                    <span className="text-[10px] font-black text-slate-700 uppercase">{doc.split('/').pop().substring(0, 25)}...</span>
                                                </div>
                                                <i className="pi pi-external-link text-blue-500 text-xs"></i>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {pestañaDetalle === 'log' && (
                                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                                    {licenciaSeleccionada.historial.map((h, i) => (
                                        <div key={i} className="relative">
                                            <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-white"></span>
                                            <p className="text-[10px] font-black text-slate-500 uppercase">{formatFecha(h.fecha)}</p>
                                            <p className="text-slate-800 font-bold mt-0.5 text-xs">{h.evento}</p>
                                            <p className="text-[10px] text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 shadow-inner">{h.notas}</p>
                                            <p className="text-[9px] text-slate-400 mt-1 italic">Autor: {h.usuario}</p>
                                        </div>
                                    ))}
                                    {(!licenciaSeleccionada.historial || licenciaSeleccionada.historial.length === 0) && (
                                        <p className="text-xs text-slate-400 text-center py-6 italic font-medium">Sin registros en el historial</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ALTA / EDITAR (SIDE DRAWER) */}
            {(mostrarModalAlta || mostrarModalEditar) && (
                <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
                    <div className="w-full md:w-[600px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-slide-in-right">
                        <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{mostrarModalAlta ? 'Nueva Suscripción SAM' : 'Editar Suscripción'}</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestión de Software y Servicios</p>
                            </div>
                            <button onClick={() => { setMostrarModalAlta(false); setMostrarModalEditar(false); }} className="text-slate-400 hover:bg-slate-200 p-2 rounded transition"><i className="pi pi-times"></i></button>
                        </div>
                        
                        <form id="licencia-form" onSubmit={mostrarModalAlta ? handleAltaLicencia : handleEditarLicencia} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar-light">
                            <div className="space-y-5">
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Identidad del Servicio</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Nombre del Software / Servicio *</label>
                                        <input required type="text" value={formLicencia.nombre} onChange={e => setFormLicencia({...formLicencia, nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Categoría *</label>
                                        <select required value={formLicencia.categoria} onChange={e => setFormLicencia({...formLicencia, categoria: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-inner">
                                            <option value="Software">Software Comercial</option>
                                            <option value="Dominio Web">Dominio Web</option>
                                            <option value="Certificado SSL">Certificado SSL</option>
                                            <option value="Hosting/Nube">Hosting / Nube</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Proveedor *</label>
                                        <select required value={formLicencia.proveedor_id} onChange={e => setFormLicencia({...formLicencia, proveedor_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-inner">
                                            <option value="">Seleccionar...</option>
                                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Contrato y Seats</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Costo Anual (MXN)</label>
                                        <input type="number" step="0.01" value={formLicencia.costo_anual} onChange={e => setFormLicencia({...formLicencia, costo_anual: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Total Asientos (Seats)</label>
                                        <input type="number" value={formLicencia.asientos_totales} onChange={e => setFormLicencia({...formLicencia, asientos_totales: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-inner" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Fecha Compra</label>
                                        <input type="date" value={formLicencia.fecha_compra} onChange={e => setFormLicencia({...formLicencia, fecha_compra: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-inner" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Fecha Vencimiento</label>
                                        <input type="date" value={formLicencia.fecha_vencimiento} onChange={e => setFormLicencia({...formLicencia, fecha_vencimiento: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 shadow-inner" />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Llave de Activación / Notas</label>
                                <textarea rows="3" value={formLicencia.llave} onChange={e => setFormLicencia({...formLicencia, llave: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none shadow-inner" />
                            </div>
                        </form>
                        
                        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => { setMostrarModalAlta(false); setMostrarModalEditar(false); }} className="px-8 py-3 rounded-xl text-xs font-black uppercase text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-sm">Cancelar</button>
                            <button form="licencia-form" type="submit" className="px-10 py-3 rounded-xl text-xs font-black uppercase bg-blue-600 text-white hover:bg-blue-700 transition shadow-lg shadow-blue-100">
                                {mostrarModalAlta ? 'Crear Registro' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL RENOVAR */}
            {mostrarModalRenovar && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                        <div className="p-6 border-b flex justify-between bg-slate-50 items-center">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Renovación de Servicio</h3>
                            <button onClick={() => setMostrarModalRenovar(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleRenovar} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nueva Fecha de Vencimiento</label>
                                <input required type="date" value={formRenovacion.nueva_fecha} onChange={e => setFormRenovacion({...formRenovacion, nueva_fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Costo de Renovación (MXN)</label>
                                <input required type="number" step="0.01" value={formRenovacion.costo} onChange={e => setFormRenovacion({...formRenovacion, costo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Notas de Renovación</label>
                                <textarea rows="2" value={formRenovacion.notas} onChange={e => setFormRenovacion({...formRenovacion, notas: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 resize-none" placeholder="Opcional..." />
                            </div>
                            <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all">Confirmar Renovación</button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                .animate-slide-in-right { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .custom-scrollbar-light::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default Licencias;
