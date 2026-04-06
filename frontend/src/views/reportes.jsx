// frontend/src/views/reportes.jsx
import React, { useState, useMemo } from 'react';

const Reportes = ({ user }) => {
    // ==========================================
    // 1. MOCK DATA (Consolidada de todos los módulos)
    // ==========================================
    const usuarios = [
        { id: 1, nombre: 'María López', zona: 'Corporativo', depto: 'Contabilidad', cc: 'CC-CON-002', estatus: 'Activo' },
        { id: 2, nombre: 'Juan Pérez', zona: 'Zona Norte', depto: 'Ventas', cc: 'CC-VTA-NTE', estatus: 'Activo' },
        { id: 3, nombre: 'Carlos Ruiz', zona: 'Corporativo', depto: 'Sistemas', cc: 'CC-SIS-004', estatus: 'Activo' },
        { id: 4, nombre: 'Laura Salas', zona: 'Zona Sur', depto: 'Operaciones', cc: 'CC-OPE-SUR', estatus: 'Inactivo' },
    ];

    const inventario = [
        { id: 1, serie: 'LT-DELL-042', equipo: 'Laptop Dell Latitude', categoria: 'Computadoras', asignado_a: 'María López', fecha_compra: '2025-01-20', anios_garantia: 3, costo: 18500, estatus: 'Activo' },
        { id: 2, serie: 'PC-HP-001', equipo: 'Desktop HP Elite', categoria: 'Computadoras', asignado_a: 'Carlos Ruiz', fecha_compra: '2021-05-10', anios_garantia: 1, costo: 12000, estatus: 'Activo' }, // Depreciado y sin garantía
        { id: 3, serie: 'MN-SAM-99', equipo: 'Monitor Samsung 24"', categoria: 'Perifericos', asignado_a: 'Sin Asignar', fecha_compra: '2023-11-05', anios_garantia: 1, costo: 3500, estatus: 'Disponible' }, // Sin garantía
        { id: 4, serie: 'CEL-IPH-13', equipo: 'iPhone 13', categoria: 'Celulares', asignado_a: 'Juan Pérez', fecha_compra: '2024-02-15', anios_garantia: 1, costo: 15000, estatus: 'En Reparacion' }, // Garantía expirada
    ];

    const licencias = [
        { id: 1, nombre: 'Google Workspace', proveedor: 'Google', categoria: 'Software', vencimiento: '2027-01-15', costo: 12500, asientos: 10 },
        { id: 2, nombre: 'Adobe CC', proveedor: 'Adobe', categoria: 'Software', vencimiento: '2026-05-10', costo: 18000, asientos: 2 },
        { id: 3, nombre: 'rubiofilms.com', proveedor: 'GoDaddy', categoria: 'Dominio Web', vencimiento: '2026-04-20', costo: 450, asientos: 1 }, // Vence pronto
        { id: 4, nombre: 'Certificado SSL', proveedor: 'DigiCert', categoria: 'Certificado SSL', vencimiento: '2025-02-20', costo: 3500, asientos: 1 }, // Expirado
    ];

    // ==========================================
    // 2. ESTADOS DEL REPORTE
    // ==========================================
    const [categoriaActiva, setCategoriaActiva] = useState('inventario');
    const [filtroEspecial, setFiltroEspecial] = useState('todos');

    // ==========================================
    // 3. LÓGICA DE NEGOCIO (Cálculos y Fechas)
    // ==========================================
    const hoy = new Date();

    const formatMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

    const analizarHardware = (equipo) => {
        const compra = new Date(equipo.fecha_compra);
        const vencimientoGarantia = new Date(compra);
        vencimientoGarantia.setFullYear(vencimientoGarantia.getFullYear() + equipo.anios_garantia);

        const fechaDepreciacion = new Date(compra);
        fechaDepreciacion.setFullYear(fechaDepreciacion.getFullYear() + 3);

        const tieneGarantia = vencimientoGarantia >= hoy;
        const estaDepreciado = fechaDepreciacion < hoy;

        return { tieneGarantia, estaDepreciado, vencimientoGarantia: vencimientoGarantia.toLocaleDateString() };
    };

    const analizarLicencia = (lic) => {
        const vencimiento = new Date(lic.vencimiento);
        const diffDays = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'Expirada';
        if (diffDays <= 30) return 'Por Expirar';
        return 'Vigente';
    };

    // ==========================================
    // 4. MOTOR DE FILTRADO
    // ==========================================
    const datosFiltrados = useMemo(() => {
        if (categoriaActiva === 'usuarios') {
            if (filtroEspecial === 'todos') return usuarios;
            if (filtroEspecial === 'activos') return usuarios.filter(u => u.estatus === 'Activo');
            if (filtroEspecial.startsWith('zona-')) return usuarios.filter(u => u.zona === filtroEspecial.split('-')[1]);
        }

        if (categoriaActiva === 'inventario') {
            return inventario.filter(eq => {
                const analisis = analizarHardware(eq);
                if (filtroEspecial === 'todos') return true;
                if (filtroEspecial === 'con_garantia') return analisis.tieneGarantia;
                if (filtroEspecial === 'sin_garantia') return !analisis.tieneGarantia;
                if (filtroEspecial === 'depreciado') return analisis.estaDepreciado;
                if (filtroEspecial === 'disponibles') return eq.estatus === 'Disponible';
                return true;
            });
        }

        if (categoriaActiva === 'licencias') {
            return licencias.filter(lic => {
                const estado = analizarLicencia(lic);
                if (filtroEspecial === 'todos') return true;
                if (filtroEspecial === 'vigentes') return estado === 'Vigente';
                if (filtroEspecial === 'por_expirar') return estado === 'Por Expirar';
                if (filtroEspecial === 'expiradas') return estado === 'Expirada';
                return true;
            });
        }
        return [];
    }, [categoriaActiva, filtroEspecial]);

    const kpiCostoTotal = datosFiltrados.reduce((acc, item) => acc + (item.costo || 0), 0);

    // ==========================================
    // 5. EXPORTACIÓN A CSV Y PDF
    // ==========================================
    const exportarCSV = () => {
        if (datosFiltrados.length === 0) return alert('No hay datos para exportar');
        const cabeceras = Object.keys(datosFiltrados[0]).join(',');
        const filas = datosFiltrados.map(obj => Object.values(obj).map(val => `"${val}"`).join(',')).join('\n');
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
        <div className="relative h-full flex flex-col" id="zona-reporte">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Reportes y Analítica</h1>
                    <p className="text-sm text-slate-400 font-medium mt-1">Exportación de datos, depreciación y métricas gerenciales.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition border border-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Imprimir PDF
                    </button>
                    <button onClick={exportarCSV} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Exportar Excel (CSV)
                    </button>
                </div>
            </div>

            {/* SELECTOR DE CATEGORÍA PRINCIPAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:hidden">
                {[
                    { id: 'inventario', titulo: 'Hardware y Activos', icono: '💻', color: 'cyan' },
                    { id: 'licencias', titulo: 'Licencias y SAM', icono: '🔑', color: 'purple' },
                    { id: 'usuarios', titulo: 'Recursos Humanos', icono: '👥', color: 'blue' }
                ].map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { setCategoriaActiva(cat.id); setFiltroEspecial('todos'); }}
                        className={`p-4 rounded-xl border text-left transition-all ${categoriaActiva === cat.id ? `bg-${cat.color}-900/20 border-${cat.color}-500 shadow-[0_0_15px_rgba(0,0,0,0.2)]` : 'bg-slate-900 border-slate-800 hover:bg-slate-800'}`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{cat.icono}</span>
                            <div><p className="font-black text-white uppercase tracking-wider">{cat.titulo}</p><p className="text-xs text-slate-400">Generar reporte</p></div>
                        </div>
                    </button>
                ))}
            </div>

            {/* SUB-FILTROS DINÁMICOS */}
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-2 items-center mb-6 print:hidden">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Filtros de Reporte:</span>
                <button onClick={() => setFiltroEspecial('todos')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition ${filtroEspecial === 'todos' ? 'bg-white text-black' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>Todos</button>

                {categoriaActiva === 'inventario' && (
                    <>
                        <button onClick={() => setFiltroEspecial('con_garantia')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'con_garantia' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Con Garantía</button>
                        <button onClick={() => setFiltroEspecial('sin_garantia')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'sin_garantia' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Sin Garantía</button>
                        <button onClick={() => setFiltroEspecial('depreciado')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'depreciado' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Depreciados</button>
                        <button onClick={() => setFiltroEspecial('disponibles')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'disponibles' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Disponibles</button>
                    </>
                )}

                {categoriaActiva === 'licencias' && (
                    <>
                        <button onClick={() => setFiltroEspecial('vigentes')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'vigentes' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Vigentes</button>
                        <button onClick={() => setFiltroEspecial('por_expirar')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'por_expirar' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Por Expirar</button>
                        <button onClick={() => setFiltroEspecial('expiradas')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'expiradas' ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Expiradas</button>
                    </>
                )}

                {categoriaActiva === 'usuarios' && (
                    <>
                        <button onClick={() => setFiltroEspecial('activos')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'activos' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Activos</button>
                        <button onClick={() => setFiltroEspecial('zona-Corporativo')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'zona-Corporativo' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Corporativo</button>
                        <button onClick={() => setFiltroEspecial('zona-Zona Norte')} className={`px-3 py-1.5 rounded text-xs font-bold uppercase transition border ${filtroEspecial === 'zona-Zona Norte' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'border-transparent bg-slate-800 text-slate-400 hover:text-white'}`}>Zona Norte</button>
                    </>
                )}
            </div>

            {/* VISTA DE IMPRESIÓN (CABECERA) */}
            <div className="hidden print:block mb-6 border-b-2 border-black pb-4">
                <h2 className="text-2xl font-black text-black uppercase">Reporte de {categoriaActiva}</h2>
                <p className="text-sm font-bold text-gray-600">Filtro aplicado: {filtroEspecial.replace('_', ' ').toUpperCase()}</p>
                <p className="text-xs text-gray-500">Generado el: {new Date().toLocaleString('es-ES')} por {user?.nombre_completo || 'Admin'}</p>
            </div>

            {/* TABLA DE RESULTADOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm print:shadow-none print:border-none print:bg-white print:overflow-visible">

                {/* KPI RESUMEN SOBRE LA TABLA */}
                <div className="bg-slate-800/50 p-4 border-b border-slate-800 flex justify-between items-center print:bg-white print:border-none print:text-black print:px-0">
                    <p className="text-sm font-bold"><span className="text-cyan-500 print:text-black">{datosFiltrados.length}</span> Registros Encontrados</p>
                    {['inventario', 'licencias'].includes(categoriaActiva) && (
                        <p className="text-sm font-bold text-slate-400 print:text-black">Valor Total (Costo): <span className="text-white print:text-black font-mono">{formatMoneda(kpiCostoTotal)}</span></p>
                    )}
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar print:overflow-visible">
                    <table className="w-full text-left border-collapse print:text-black print:w-full">
                        <thead className="sticky top-0 bg-slate-900 print:bg-gray-100 print:text-black print:relative">
                            <tr className="border-b border-slate-800 print:border-gray-400 text-xs font-bold text-slate-400 uppercase tracking-widest print:text-black">

                                {categoriaActiva === 'inventario' && (
                                    <>
                                        <th className="p-4 print:py-2">Equipo y Serie</th>
                                        <th className="p-4 print:py-2">Asignado a</th>
                                        <th className="p-4 print:py-2">Adquisición y Costo</th>
                                        <th className="p-4 print:py-2">Estado Legal / Contable</th>
                                    </>
                                )}

                                {categoriaActiva === 'licencias' && (
                                    <>
                                        <th className="p-4 print:py-2">Software / Suscripción</th>
                                        <th className="p-4 print:py-2">Proveedor</th>
                                        <th className="p-4 print:py-2">Asientos</th>
                                        <th className="p-4 print:py-2">Costo / Vencimiento</th>
                                    </>
                                )}

                                {categoriaActiva === 'usuarios' && (
                                    <>
                                        <th className="p-4 print:py-2">Empleado</th>
                                        <th className="p-4 print:py-2">Zona</th>
                                        <th className="p-4 print:py-2">Depto / C.C.</th>
                                        <th className="p-4 print:py-2">Estatus</th>
                                    </>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-800/50 print:divide-gray-300 text-sm">
                            {datosFiltrados.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-800/30 transition-colors">

                                    {categoriaActiva === 'inventario' && (() => {
                                        const analisis = analizarHardware(row);
                                        return (
                                            <>
                                                <td className="p-4 print:py-3"><p className="font-bold text-white print:text-black">{row.equipo}</p><p className="text-[10px] font-mono text-slate-400 print:text-gray-600">SN: {row.serie}</p></td>
                                                <td className="p-4 print:py-3"><span className={`font-bold ${row.asignado_a === 'Sin Asignar' ? 'text-slate-500 italic print:text-gray-500' : 'text-slate-300 print:text-black'}`}>{row.asignado_a}</span></td>
                                                <td className="p-4 print:py-3"><p className="font-mono text-slate-300 print:text-black">{formatMoneda(row.costo)}</p><p className="text-[10px] text-slate-500 print:text-gray-600 uppercase tracking-widest">{row.fecha_compra}</p></td>
                                                <td className="p-4 print:py-3 space-y-1">
                                                    <div>
                                                        {analisis.tieneGarantia
                                                            ? <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 print:border-none print:bg-transparent print:text-black print:p-0">Garantía Activa ({analisis.vencimientoGarantia})</span>
                                                            : <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 print:border-none print:bg-transparent print:text-black print:p-0">Garantía Expirada</span>
                                                        }
                                                    </div>
                                                    <div>
                                                        {analisis.estaDepreciado && <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 print:border-none print:bg-transparent print:text-black print:p-0">Depreciación Vencida</span>}
                                                    </div>
                                                </td>
                                            </>
                                        )
                                    })()}

                                    {categoriaActiva === 'licencias' && (() => {
                                        const estadoLic = analizarLicencia(row);
                                        return (
                                            <>
                                                <td className="p-4 print:py-3"><p className="font-bold text-white print:text-black">{row.nombre}</p><p className="text-[10px] font-mono text-slate-400 print:text-gray-600">{row.categoria}</p></td>
                                                <td className="p-4 print:py-3 font-bold text-slate-300 print:text-black">{row.proveedor}</td>
                                                <td className="p-4 print:py-3 text-slate-400 print:text-black">{row.asientos} Licencias</td>
                                                <td className="p-4 print:py-3">
                                                    <p className="font-mono text-white print:text-black mb-1">{formatMoneda(row.costo)}</p>
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border print:border-none print:bg-transparent print:text-black print:p-0 ${estadoLic === 'Vigente' ? 'bg-green-500/10 text-green-400 border-green-500/20' : estadoLic === 'Por Expirar' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {estadoLic} ({row.vencimiento})
                                                    </span>
                                                </td>
                                            </>
                                        )
                                    })()}

                                    {categoriaActiva === 'usuarios' && (
                                        <>
                                            <td className="p-4 print:py-3 font-bold text-white print:text-black">{row.nombre}</td>
                                            <td className="p-4 print:py-3 text-slate-300 font-semibold print:text-black">{row.zona}</td>
                                            <td className="p-4 print:py-3"><p className="text-slate-300 print:text-black">{row.depto}</p><p className="text-[10px] font-mono text-cyan-500 print:text-gray-600">{row.cc}</p></td>
                                            <td className="p-4 print:py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase print:border-none print:bg-transparent print:text-black print:p-0 ${row.estatus === 'Activo' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    {row.estatus}
                                                </span>
                                            </td>
                                        </>
                                    )}

                                </tr>
                            ))}
                            {datosFiltrados.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium print:text-black">No se encontraron datos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MAGIA CSS PARA IMPRESIÓN PERFECta */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @media print {
          /* 1. Sugerimos impresión en horizontal (apaisado) para que quepan las columnas */
          @page { size: landscape; margin: 10mm; }
          
          /* 2. Destruimos completamente el menú lateral y la barra superior para que liberen el espacio */
          aside, header, .print\\:hidden { 
            display: none !important; 
          }

          /* 3. Forzamos a que el contenido principal ocupe todo el ancho de la hoja blanca */
          body, main, #root { 
            background-color: white !important; 
            color: black !important;
            margin: 0 !important; 
            padding: 0 !important; 
            width: 100vw !important;
            max-width: 100% !important;
            overflow: visible !important;
          }

          /* 4. Limpiamos los fondos oscuros del tema de pantalla */
          .bg-slate-900, .bg-slate-950, .bg-slate-800 {
            background-color: white !important;
          }

          /* 5. Estiramos la tabla al 100% */
          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            table-layout: auto !important;
          }
          
          th, td { 
            color: black !important;
          }

          th {
            background-color: #f3f4f6 !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
        }
      `}} />
        </div>
    );
};

export default Reportes;