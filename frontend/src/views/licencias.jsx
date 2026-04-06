// frontend/src/views/licencias.jsx
import React, { useState } from 'react';

const Licencias = ({ user }) => {
    // --- MOCK DATA: Usuarios (Para asignar asientos) ---
    const [catalogoUsuarios] = useState(['María López', 'Juan Pérez', 'Ana Gómez', 'Carlos Ruiz', 'Alejandro Rubio', 'Laura Salas']);

    // --- MOCK DATA: Licencias y Suscripciones ---
    const [licencias, setLicencias] = useState([
        {
            id: 1, nombre: 'Google Workspace Enterprise', categoria: 'Software', proveedor: 'Google',
            costo_anual: 12500, fecha_compra: '2023-01-15', fecha_vencimiento: '2027-01-15',
            asientos_totales: 10,
            asientos_asignados: ['María López', 'Alejandro Rubio', 'Carlos Ruiz', 'Juan Pérez'],
            llave: 'Suscripción en Nube (Admin Console)',
            historial: [
                { id: 101, fecha: '15 Ene 2026', accion: 'Renovación Anual', usuario: 'Admin', notas: 'Se pagó la anualidad por $12,500 MXN' }
            ]
        },
        {
            id: 2, nombre: 'Adobe Creative Cloud', categoria: 'Software', proveedor: 'Adobe Inc.',
            costo_anual: 18000, fecha_compra: '2025-05-10', fecha_vencimiento: '2026-05-10', // Cerca de expirar
            asientos_totales: 2,
            asientos_asignados: ['Ana Gómez', 'Laura Salas'],
            llave: 'Asignado vía email corporativo',
            historial: [
                { id: 201, fecha: '10 May 2025', accion: 'Compra Inicial', usuario: 'Admin', notas: 'Compra de 2 licencias completas.' }
            ]
        },
        {
            id: 3, nombre: 'rubiofilms.com', categoria: 'Dominio Web', proveedor: 'GoDaddy',
            costo_anual: 450, fecha_compra: '2020-11-01', fecha_vencimiento: '2026-04-15', // Muy cerca de expirar
            asientos_totales: 1,
            asientos_asignados: ['Sistemas (Global)'],
            llave: 'N/A',
            historial: []
        },
        {
            id: 4, nombre: 'Certificado SSL Wildcard', categoria: 'Certificado SSL', proveedor: 'DigiCert',
            costo_anual: 3500, fecha_compra: '2024-02-20', fecha_vencimiento: '2025-02-20', // Expirado
            asientos_totales: 1,
            asientos_asignados: ['Sistemas (Global)'],
            llave: 'Instalado en Servidor AWS',
            historial: []
        }
    ]);

    // --- ESTADOS DE LA UI ---
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('Todas');
    const [licenciaSeleccionada, setLicenciaSeleccionada] = useState(null);

    // Modales
    const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
    const [mostrarModalRenovar, setMostrarModalRenovar] = useState(false);
    const [pestañaDetalle, setPestañaDetalle] = useState('info');

    // Formularios
    const [formNuevaLicencia, setFormNuevaLicencia] = useState({ nombre: '', categoria: 'Software', proveedor: '', costo_anual: '', fecha_compra: '', fecha_vencimiento: '', asientos_totales: 1, llave: '' });
    const [formRenovacion, setFormRenovacion] = useState({ nueva_fecha: '', costo: '', notas: '' });
    const [nuevoAsiento, setNuevoAsiento] = useState('');

    // --- LÓGICA DE FECHAS Y SEMÁFOROS (Crucial para SAM) ---
    const calcularEstado = (fechaVencimiento) => {
        if (!fechaVencimiento) return { estado: 'Sin Fecha', dias: 0, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
        const hoy = new Date();
        const vencimiento = new Date(fechaVencimiento);
        const diffTime = vencimiento - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { estado: 'Expirada', dias: Math.abs(diffDays), color: 'text-red-400 bg-red-500/10 border-red-500/20', urgente: true };
        if (diffDays <= 30) return { estado: 'Por Expirar', dias: diffDays, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', urgente: true };
        return { estado: 'Vigente', dias: diffDays, color: 'text-green-400 bg-green-500/10 border-green-500/20', urgente: false };
    };

    const formatoMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
    const formatFecha = () => new Date().toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    // --- FILTROS ---
    const licenciasFiltradas = licencias.filter(l => {
        const coincideBusqueda = l.nombre.toLowerCase().includes(busqueda.toLowerCase()) || l.proveedor.toLowerCase().includes(busqueda.toLowerCase());
        const coincideFiltro = filtroCategoria === 'Todas' || l.categoria === filtroCategoria;
        return coincideBusqueda && coincideFiltro;
    });

    // KPI Dashboard
    const kpiTotal = licencias.length;
    const kpiUrgentes = licencias.filter(l => calcularEstado(l.fecha_vencimiento).urgente).length;
    const kpiCostoTotal = licencias.reduce((acc, l) => acc + Number(l.costo_anual), 0);

    // --- ACCIONES ---
    const handleAltaLicencia = (e) => {
        e.preventDefault();
        const nueva = {
            id: Date.now(),
            ...formNuevaLicencia,
            asientos_asignados: [],
            historial: [{ id: Date.now() + 1, fecha: formatFecha(), accion: 'Alta en Sistema', usuario: user?.nombre_completo || 'Admin', notas: 'Registro inicial.' }]
        };
        setLicencias([nueva, ...licencias]);
        setMostrarModalAlta(false);
        setFormNuevaLicencia({ nombre: '', categoria: 'Software', proveedor: '', costo_anual: '', fecha_compra: '', fecha_vencimiento: '', asientos_totales: 1, llave: '' });
    };

    const handleRenovar = (e) => {
        e.preventDefault();
        const historialEntry = {
            id: Date.now(), fecha: formatFecha(), accion: 'Renovación Procesada', usuario: user?.nombre_completo || 'Admin',
            notas: `Nueva vigencia: ${formRenovacion.nueva_fecha}. Costo: ${formatoMoneda(formRenovacion.costo)}. Notas: ${formRenovacion.notas}`
        };

        const actualizadas = licencias.map(l => {
            if (l.id === licenciaSeleccionada.id) {
                const renovada = { ...l, fecha_vencimiento: formRenovacion.nueva_fecha, costo_anual: formRenovacion.costo, historial: [historialEntry, ...l.historial] };
                setLicenciaSeleccionada(renovada);
                return renovada;
            }
            return l;
        });

        setLicencias(actualizadas);
        setMostrarModalRenovar(false);
        setFormRenovacion({ nueva_fecha: '', costo: '', notas: '' });
    };

    const asignarAsiento = () => {
        if (!nuevoAsiento) return;
        if (licenciaSeleccionada.asientos_asignados.length >= licenciaSeleccionada.asientos_totales) {
            alert("No hay asientos disponibles. Compra más licencias o libera una.");
            return;
        }
        if (licenciaSeleccionada.asientos_asignados.includes(nuevoAsiento)) return;

        const actualizadas = licencias.map(l => {
            if (l.id === licenciaSeleccionada.id) {
                const modificada = {
                    ...l,
                    asientos_asignados: [...l.asientos_asignados, nuevoAsiento],
                    historial: [{ id: Date.now(), fecha: formatFecha(), accion: 'Asiento Asignado', usuario: user?.nombre_completo || 'Admin', notas: `Asignada a ${nuevoAsiento}` }, ...l.historial]
                };
                setLicenciaSeleccionada(modificada);
                return modificada;
            }
            return l;
        });
        setLicencias(actualizadas);
        setNuevoAsiento('');
    };

    const quitarAsiento = (usuarioQuitar) => {
        if (!window.confirm(`¿Quitar licencia a ${usuarioQuitar}?`)) return;
        const actualizadas = licencias.map(l => {
            if (l.id === licenciaSeleccionada.id) {
                const modificada = {
                    ...l,
                    asientos_asignados: l.asientos_asignados.filter(u => u !== usuarioQuitar),
                    historial: [{ id: Date.now(), fecha: formatFecha(), accion: 'Asiento Liberado', usuario: user?.nombre_completo || 'Admin', notas: `Se retiró acceso a ${usuarioQuitar}` }, ...l.historial]
                };
                setLicenciaSeleccionada(modificada);
                return modificada;
            }
            return l;
        });
        setLicencias(actualizadas);
    };

    return (
        <div className="relative h-full flex flex-col">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Software y Renovaciones</h1>
                    <p className="text-sm text-slate-400 font-medium mt-1">Gestión de activos intangibles (SAM), dominios y vencimientos.</p>
                </div>
                <button onClick={() => setMostrarModalAlta(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-purple-900/50 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    Nueva Suscripción
                </button>
            </div>

            {/* DASHBOARD KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Registros</p><p className="text-2xl font-black text-white">{kpiTotal}</p></div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Requieren Atención (Vencen)</p><p className="text-2xl font-black text-white">{kpiUrgentes}</p></div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Inversión Anual Aprox.</p><p className="text-xl font-black text-white">{formatoMoneda(kpiCostoTotal)}</p></div>
                </div>
            </div>

            {/* FILTROS */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input type="text" placeholder="Buscar software o proveedor..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full md:w-1/3 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors shadow-sm" />
                <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                    {['Todas', 'Software', 'Dominio Web', 'Certificado SSL'].map(cat => (
                        <button key={cat} onClick={() => setFiltroCategoria(cat)} className={`px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition whitespace-nowrap ${filtroCategoria === cat ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'}`}>{cat}</button>
                    ))}
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-900 z-10">
                            <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                                <th className="p-4 pl-6">Suscripción / Software</th>
                                <th className="p-4">Ocupación (Asientos)</th>
                                <th className="p-4">Costo Anual</th>
                                <th className="p-4">Semáforo de Vencimiento</th>
                                <th className="p-4 text-right pr-6">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-sm">
                            {licenciasFiltradas.map((lic) => {
                                const estado = calcularEstado(lic.fecha_vencimiento);
                                const porcentajeUso = (lic.asientos_asignados.length / lic.asientos_totales) * 100;
                                return (
                                    <tr key={lic.id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <p className="font-bold text-white mb-0.5">{lic.nombre}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{lic.categoria} • {lic.proveedor}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-300">{lic.asientos_asignados.length} / {lic.asientos_totales}</span>
                                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${porcentajeUso >= 100 ? 'bg-red-500' : porcentajeUso >= 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${Math.min(porcentajeUso, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-mono font-medium text-slate-300">{formatoMoneda(lic.costo_anual)}</td>
                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${estado.color}`}>
                                                {estado.estado === 'Vigente' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                                                {estado.estado === 'Por Expirar' && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>}
                                                {estado.estado === 'Expirada' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {estado.estado} {estado.estado !== 'Expirada' && `(${estado.dias} días)`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <button onClick={() => { setLicenciaSeleccionada(lic); setPestañaDetalle('info'); }} className="text-purple-400 hover:text-white transition font-bold text-[10px] uppercase tracking-widest bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 rounded">Gestionar</button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {licenciasFiltradas.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">No se encontraron registros.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ========================================= */}
            {/* DRAWER: DETALLES Y GESTIÓN DE LICENCIA    */}
            {/* ========================================= */}
            {licenciaSeleccionada && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
                    <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">
                        <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-start bg-slate-800/50 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mb-2 inline-block">{licenciaSeleccionada.categoria}</span>
                                <h2 className="text-2xl font-black text-white mb-1">{licenciaSeleccionada.nombre}</h2>
                                <p className="text-sm font-bold text-slate-400">Proveedor: {licenciaSeleccionada.proveedor}</p>
                            </div>
                            <button onClick={() => setLicenciaSeleccionada(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition z-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>

                        <div className="flex border-b border-slate-800 px-6 pt-4 gap-6 bg-slate-900 overflow-x-auto custom-scrollbar">
                            <button onClick={() => setPestañaDetalle('info')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${pestañaDetalle === 'info' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Contrato y Costos</button>
                            <button onClick={() => setPestañaDetalle('asientos')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${pestañaDetalle === 'asientos' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Asientos / Usuarios <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px]">{licenciaSeleccionada.asientos_asignados.length}</span></button>
                            <button onClick={() => setPestañaDetalle('log')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${pestañaDetalle === 'log' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Historial Pagos <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px]">{licenciaSeleccionada.historial.length}</span></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">

                            {/* PESTAÑA 1: INFO GENERAL */}
                            {pestañaDetalle === 'info' && (
                                <div className="space-y-6 animate-fade-in">

                                    {/* ALERTA DE VENCIMIENTO */}
                                    {(() => {
                                        const estado = calcularEstado(licenciaSeleccionada.fecha_vencimiento);
                                        return estado.urgente && (
                                            <div className={`p-4 rounded-xl border flex items-start gap-4 ${estado.estado === 'Expirada' ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-orange-900/20 border-orange-500/30 text-orange-400'}`}>
                                                <svg className="w-6 h-6 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                                <div>
                                                    <h4 className="font-bold text-sm uppercase tracking-wider">{estado.estado === 'Expirada' ? '¡Suscripción Vencida!' : 'Atención: Vencimiento Próximo'}</h4>
                                                    <p className="text-xs mt-1 opacity-80">El servicio caduca el {licenciaSeleccionada.fecha_vencimiento}. Evita interrupciones en la operación.</p>
                                                </div>
                                            </div>
                                        )
                                    })()}

                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 relative">
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Módulo de Renovación</h3>
                                        <div className="flex justify-between items-end">
                                            <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vence Oficialmente el:</p><p className="text-xl font-black text-white">{licenciaSeleccionada.fecha_vencimiento}</p></div>
                                            {!mostrarModalRenovar ? (
                                                <button onClick={() => setMostrarModalRenovar(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition shadow-lg">Registrar Pago / Renovar</button>
                                            ) : (
                                                <button onClick={() => setMostrarModalRenovar(false)} className="text-slate-400 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition">Cancelar Renovación</button>
                                            )}
                                        </div>

                                        {mostrarModalRenovar && (
                                            <form onSubmit={handleRenovar} className="mt-5 pt-5 border-t border-slate-700 space-y-4 animate-fade-in">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 block">Nueva Fecha Vencimiento *</label><input type="date" required value={formRenovacion.nueva_fecha} onChange={(e) => setFormRenovacion({ ...formRenovacion, nueva_fecha: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-purple-500" /></div>
                                                    <div><label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 block">Costo Pagado (MXN) *</label><input type="number" required value={formRenovacion.costo} onChange={(e) => setFormRenovacion({ ...formRenovacion, costo: e.target.value })} className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-purple-500" /></div>
                                                </div>
                                                <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Factura o Notas</label><input type="text" value={formRenovacion.notas} onChange={(e) => setFormRenovacion({ ...formRenovacion, notas: e.target.value })} placeholder="Ej. Factura #5992..." className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded px-3 py-2 outline-none focus:border-purple-500" /></div>
                                                <button type="submit" className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-[10px] uppercase tracking-wider transition">Confirmar Renovación</button>
                                            </form>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 bg-slate-900 border border-slate-800 p-5 rounded-xl">
                                        <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Costo Actual Configurado</p><p className="text-sm font-bold text-white font-mono">{formatoMoneda(licenciaSeleccionada.costo_anual)} / año</p></div>
                                        <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Licencias (Seats)</p><p className="text-sm font-bold text-white">{licenciaSeleccionada.asientos_totales} asientos comprados</p></div>
                                        <div className="col-span-2 pt-4 border-t border-slate-800"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Llaves de Activación / Notas</p><p className="text-sm text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">{licenciaSeleccionada.llave}</p></div>
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA 2: ASIENTOS (GENTE) */}
                            {pestañaDetalle === 'asientos' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Asignar a Usuario</h3>
                                            <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded">Disponibles: {licenciaSeleccionada.asientos_totales - licenciaSeleccionada.asientos_asignados.length}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <input list="usuarios-licencia" value={nuevoAsiento} onChange={(e) => setNuevoAsiento(e.target.value)} placeholder="Buscar usuario..." className="flex-1 bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-purple-500" />
                                            <datalist id="usuarios-licencia">{catalogoUsuarios.map(u => <option key={u} value={u} />)}</datalist>
                                            <button onClick={asignarAsiento} disabled={!nuevoAsiento || licenciaSeleccionada.asientos_asignados.length >= licenciaSeleccionada.asientos_totales} className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition">Asignar</button>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Ocupantes Actuales</h3>
                                        <div className="space-y-2">
                                            {licenciaSeleccionada.asientos_asignados.map(usuario => (
                                                <div key={usuario} className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex justify-between items-center group">
                                                    <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-black text-xs">{usuario.charAt(0)}</div><span className="font-bold text-white text-sm">{usuario}</span></div>
                                                    <button onClick={() => quitarAsiento(usuario)} className="text-slate-500 hover:text-red-500 text-[10px] font-bold uppercase tracking-widest transition px-2 py-1 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 rounded">Revocar</button>
                                                </div>
                                            ))}
                                            {licenciaSeleccionada.asientos_asignados.length === 0 && <p className="text-sm text-slate-500 italic">No hay nadie usando esta licencia.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PESTAÑA 3: LOG CONTABLE */}
                            {pestañaDetalle === 'log' && (
                                <div className="relative pl-4 border-l-2 border-slate-800 space-y-8 ml-2 mt-2 animate-fade-in">
                                    {licenciaSeleccionada.historial.map((item, index) => (
                                        <div key={item.id} className="relative">
                                            <span className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 ${index === 0 ? 'border-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'border-slate-600'}`}></span>
                                            <div className={`bg-slate-800/40 border p-4 rounded-lg ml-2 group transition-colors ${index === 0 ? 'border-purple-500/30' : 'border-slate-700/50'}`}>
                                                <div className="flex justify-between items-start mb-2"><h4 className={`text-xs font-black uppercase tracking-wider ${index === 0 ? 'text-purple-400' : 'text-slate-300'}`}>{item.accion}</h4><span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{item.fecha}</span></div>
                                                <p className="text-sm font-bold text-white mb-1">{item.usuario}</p>
                                                <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-slate-600 pl-2 mt-2">{item.notas}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {licenciaSeleccionada.historial.length === 0 && <p className="text-slate-500 text-sm ml-2">No hay historial registrado.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================= */}
            {/* MODAL ALTA NUEVA SUSCRIPCION              */}
            {/* ========================================= */}
            {mostrarModalAlta && (
                <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
                    <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg></div>
                                <div><h2 className="text-lg font-black text-white">Alta de Suscripción</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SAM & Costos</p></div>
                            </div>
                            <button onClick={() => setMostrarModalAlta(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <form id="form-alta-licencia" onSubmit={handleAltaLicencia} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nombre del Software / Servicio *</label>
                                        <input type="text" required value={formNuevaLicencia.nombre} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, nombre: e.target.value })} placeholder="Ej. Office 365, Dominio.com" className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-purple-500" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Categoría *</label>
                                        <select value={formNuevaLicencia.categoria} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, categoria: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-purple-500">
                                            <option value="Software">Software Comercial</option><option value="Dominio Web">Dominio Web</option><option value="Certificado SSL">Certificado SSL</option><option value="Hosting/Nube">Hosting / Nube</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Proveedor *</label>
                                        <input type="text" required value={formNuevaLicencia.proveedor} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, proveedor: e.target.value })} placeholder="Ej. Microsoft, GoDaddy..." className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 border border-purple-900/30 bg-purple-900/10 rounded-xl">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 block">Fecha de Compra</label>
                                        <input type="date" required value={formNuevaLicencia.fecha_compra} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, fecha_compra: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 block">Vencimiento (Renovación) *</label>
                                        <input type="date" required value={formNuevaLicencia.fecha_vencimiento} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, fecha_vencimiento: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-purple-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Costo Anual (MXN) *</label>
                                        <input type="number" required value={formNuevaLicencia.costo_anual} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, costo_anual: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex justify-between"><span>Asientos / Usuarios</span></label>
                                        <input type="number" min="1" required value={formNuevaLicencia.asientos_totales} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, asientos_totales: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500" />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Llave de Activación o URL</label>
                                    <input type="text" value={formNuevaLicencia.llave} onChange={(e) => setFormNuevaLicencia({ ...formNuevaLicencia, llave: e.target.value })} placeholder="XXXX-XXXX-XXXX o URL de Admin" className="w-full bg-slate-950 border border-slate-700 text-slate-300 font-mono text-sm rounded-lg px-4 py-3 outline-none focus:border-purple-500" />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
                            <button onClick={() => setMostrarModalAlta(false)} className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 transition">Cancelar</button>
                            <button form="form-alta-licencia" type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg">Guardar Registro</button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}} />
        </div>
    );
};

export default Licencias;