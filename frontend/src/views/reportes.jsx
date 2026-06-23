// frontend/src/views/reportes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import clienteAxios from '../api/axios';

const Reportes = ({ user }) => {
    const [usuarios, setUsuarios] = useState([]);
    const [activos, setActivos] = useState([]);
    const [licencias, setLicencias] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [mantenimientos, setMantenimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    
    const [categoriaActiva, setCategoriaActiva] = useState('inventario');
    const [rangoFecha, setRangoFecha] = useState('mes');
    const [fechasLibres, setFechasLibres] = useState({ inicio: '', fin: '' });
    
    // Filtros secundarios
    const [filtroUsuario, setFiltroUsuario] = useState('todos');
    const [filtroTecnico, setFiltroTecnico] = useState('todos');
    const [filtroZona, setFiltroZona] = useState('todos');
    const [filtroDepto, setFiltroDepto] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            setCargando(true);
            try {
                const [resUsers, resActivos, resLics, resTickets] = await Promise.all([
                    clienteAxios.get('/usuarios/'),
                    clienteAxios.get('/activos/'),
                    clienteAxios.get('/licencias/'),
                    clienteAxios.get('/tickets/')
                ]);
                setUsuarios(resUsers.data);
                setActivos(resActivos.data);
                setLicencias(resLics.data);
                setTickets(resTickets.data);
                
                const allMantos = resActivos.data.flatMap(a => (a.mantenimientos || []).map(m => ({
                    ...m,
                    activo_codigo: a.codigo,
                    activo_modelo: a.modelo
                })));
                setMantenimientos(allMantos);
            } catch (error) {
                console.error("Error cargando datos para reportes", error);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    const formatMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);

    const checkFecha = (fechaStr) => {
        if (!fechaStr || rangoFecha === 'todos') return true;
        const f = new Date(fechaStr);
        f.setHours(0,0,0,0);
        const hoyRef = new Date();
        hoyRef.setHours(0,0,0,0);
        
        if (rangoFecha === 'dia') return f.getTime() === hoyRef.getTime();
        if (rangoFecha === 'semana') {
            const haceUnaSemana = new Date();
            haceUnaSemana.setDate(hoyRef.getDate() - 7);
            return f >= haceUnaSemana;
        }
        if (rangoFecha === 'mes') return f.getMonth() === hoyRef.getMonth() && f.getFullYear() === hoyRef.getFullYear();
        if (rangoFecha === 'libre') {
            if (!fechasLibres.inicio || !fechasLibres.fin) return true;
            const fIni = new Date(fechasLibres.inicio);
            const fFin = new Date(fechasLibres.fin);
            fIni.setHours(0,0,0,0);
            fFin.setHours(23,59,59,999);
            return f >= fIni && f <= fFin;
        }
        return true;
    };

    const datosFiltrados = useMemo(() => {
        let base = [];
        if (categoriaActiva === 'inventario') {
            base = activos.filter(a => {
                const passDepto = filtroDepto === 'todos' || a.departamento === filtroDepto;
                const passZona = filtroZona === 'todos' || a.usuario?.zona === filtroZona;
                return passDepto && passZona;
            });
        } else if (categoriaActiva === 'tickets') {
            base = tickets.filter(t => {
                const passFecha = checkFecha(t.fecha_creacion);
                const passUser = filtroUsuario === 'todos' || t.solicitante_id === parseInt(filtroUsuario);
                const passTec = filtroTecnico === 'todos' || t.tecnico_asignado_id === parseInt(filtroTecnico);
                return passFecha && passUser && passTec;
            });
        } else if (categoriaActiva === 'bitacora') {
            base = mantenimientos.filter(m => {
                const passFecha = checkFecha(m.fecha);
                const passTec = filtroTecnico === 'todos' || m.tecnico_id === parseInt(filtroTecnico);
                return passFecha && passTec;
            });
        } else if (categoriaActiva === 'usuarios') {
            base = usuarios.filter(u => {
                const passZona = filtroZona === 'todos' || u.zona === filtroZona;
                return passZona;
            });
        }

        if (busqueda) {
            const b = busqueda.toLowerCase();
            return base.filter(d => 
                (d.titulo?.toLowerCase().includes(b)) || 
                (d.modelo?.toLowerCase().includes(b)) || 
                (d.nombre_completo?.toLowerCase().includes(b)) || 
                (d.codigo?.toLowerCase().includes(b))
            );
        }
        return base;
    }, [categoriaActiva, rangoFecha, fechasLibres, filtroUsuario, filtroTecnico, filtroZona, filtroDepto, busqueda, activos, tickets, mantenimientos, usuarios]);

    const exportarCSV = () => {
        if (datosFiltrados.length === 0) return alert('No hay datos para exportar');
        const csvData = datosFiltrados.map(d => ({
            ID: d.id || d.codigo,
            Fecha: d.fecha || d.fecha_creacion || 'N/A',
            Referencia: d.titulo || d.modelo || d.nombre_completo || d.descripcion,
            Responsable: d.tecnico?.nombre_completo || d.solicitante?.nombre_completo || d.asignado_a || 'N/A',
            Métrica: d.costo || d.estatus || (d.is_active ? 'Activo' : 'Inactivo')
        }));
        
        const cabeceras = Object.keys(csvData[0]).join(',');
        const filas = csvData.map(obj => Object.values(obj).map(val => `"${val}"`).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + cabeceras + "\n" + filas;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_${categoriaActiva}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="relative h-full flex flex-col font-sans bg-[#f9fafc] p-6 overflow-y-auto custom-scrollbar-light">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Reportes y Analítica</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Exportación de datos estructurada por dimensiones críticas.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={exportarCSV} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded shadow font-bold text-sm transition flex items-center gap-2">
                        EXPORTAR CSV
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-8 border-b border-slate-200 print:hidden overflow-x-auto whitespace-nowrap">
                {[
                    { id: 'inventario', label: 'Inventario / Zonas' },
                    { id: 'tickets', label: 'Tickets / SLA' },
                    { id: 'bitacora', label: 'Mantenimientos' },
                    { id: 'usuarios', label: 'Usuarios / Deptos' }
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => {
                            setCategoriaActiva(tab.id);
                            setFiltroUsuario('todos');
                            setFiltroTecnico('todos');
                            setFiltroZona('todos');
                            setFiltroDepto('todos');
                        }}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${categoriaActiva === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* FILTROS */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo</label>
                    <select value={rangoFecha} onChange={e => setRangoFecha(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-bold">
                        <option value="dia">Hoy</option>
                        <option value="semana">Últimos 7 días</option>
                        <option value="mes">Mes en curso</option>
                        <option value="libre">Rango Libre</option>
                        <option value="todos">Todo el historial</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Búsqueda</label>
                    <input 
                        type="text" 
                        placeholder="Nombre, ID..." 
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zona</label>
                    <select value={filtroZona} onChange={e => setFiltroZona(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-bold">
                        <option value="todos">Todas las zonas</option>
                        {[...new Set(usuarios.map(u => u.zona))].filter(Boolean).map(z => (
                            <option key={z} value={z}>{z}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsable</label>
                    <select value={filtroTecnico} onChange={e => setFiltroTecnico(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-bold">
                        <option value="todos">Todos</option>
                        {usuarios.filter(u => u.rol !== 'Usuario').map(t => (
                            <option key={t.id} value={t.id}>{t.nombre_completo}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* TABLA */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/30">
                                <th className="p-6">Referencia / Título</th>
                                <th className="p-6">Responsable / Entidad</th>
                                <th className="p-6">Fecha / Registro</th>
                                <th className="p-6 text-right">Métrica / Estatus</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cargando ? (
                                <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold animate-pulse">Cargando...</td></tr>
                            ) : datosFiltrados.length === 0 ? (
                                <tr><td colSpan="4" className="p-20 text-center text-slate-400 italic">No hay registros.</td></tr>
                            ) : datosFiltrados.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6">
                                        <p className="font-bold text-slate-800">{row.titulo || row.modelo || row.activo_modelo || row.nombre_completo || row.descripcion?.substring(0, 40) + '...'}</p>
                                        <p className="text-[10px] font-mono text-slate-500 uppercase">{row.id || row.codigo || row.activo_codigo}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-bold text-slate-700">{row.solicitante?.nombre_completo || row.tecnico?.nombre_completo || row.asignado_a || 'Sistemas'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{row.departamento || row.zona || 'N/A'}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="text-sm font-bold text-slate-700">{new Date(row.fecha || row.fecha_creacion).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-medium">{new Date(row.fecha || row.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="p-6 text-right">
                                        {row.costo !== undefined ? (
                                            <p className="font-black text-slate-800">{formatMoneda(row.costo)}</p>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase border ${row.estatus === 'Cerrado' || row.estatus === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {row.estatus || (row.is_active ? 'Activo' : 'Inactivo')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar-light::-webkit-scrollbar { width: 5px; height: 5px; }
                .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                @media print {
                    aside, .print\\:hidden { display: none !important; }
                    .bg-[#f9fafc] { background: white !important; }
                    .shadow-sm { shadow: none !important; }
                }
                `
            }} />
        </div>
    );
};

export default Reportes;
