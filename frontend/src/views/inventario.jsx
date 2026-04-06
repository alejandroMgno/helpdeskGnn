// frontend/src/views/inventario.jsx
import React, { useState, useRef } from 'react';

const Inventario = ({ user, token }) => {
  // --- ESTADOS DINÁMICOS: Catálogos y Configuraciones ---
  const [catalogoProveedores, setCatalogoProveedores] = useState(['PC Link S.A. de C.V.', 'Telcel Corporativo', 'Office Depot', 'Amazon Business', 'Dell Directo']);
  const [catalogoMarcas, setCatalogoMarcas] = useState(['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'Cisco']);
  const [catalogoSoftware, setCatalogoSoftware] = useState(['Office 365 E3', 'Windows 11 Pro', 'AutoCAD 2024', 'Adobe Creative Cloud', 'Antivirus ESET']);

  const [catalogoUsuarios] = useState([
    { nombre: 'María López', departamento: 'Contabilidad' },
    { nombre: 'Juan Pérez', departamento: 'Ventas' },
    { nombre: 'Ana Gómez', departamento: 'Recursos Humanos' },
    { nombre: 'Carlos Ruiz', departamento: 'Sistemas' },
    { nombre: 'Alejandro Rubio', departamento: 'Dirección' },
    { nombre: 'Laura Salas', departamento: 'Operaciones' }
  ]);

  const [configEmpresa, setConfigEmpresa] = useState({
    nombre: 'Rubio Films',
    logoUrl: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'
  });

  const [docStyle, setDocStyle] = useState({ fontSize: 14, textAlign: 'justify' });

  // PLANTILLA ACTUALIZADA: Usamos el tag {{ESPACIO_FIRMA}} para inyectar la firma o la línea
  const [plantillaResguardo, setPlantillaResguardo] = useState(
    "CARTA DE RESGUARDO DE EQUIPO TÉCNICO\n\nPor medio de la presente, yo, {{ASIGNADO_A}}, del departamento de {{DEPARTAMENTO}}, acepto de conformidad el resguardo de los siguientes equipos propiedad de la empresa:\n\n{{TABLA_ACTIVOS}}\n\nCONDICIONES DE USO:\n1. Me comprometo a cuidar los equipos y utilizarlos exclusivamente para fines laborales correspondientes a mi puesto.\n2. En caso de robo, me comprometo a levantar el acta correspondiente ante el Ministerio Público en un plazo no mayor a 24 horas.\n3. En caso de daño por negligencia, descuido o pérdida injustificada, autorizo a la empresa a realizar el descuento correspondiente vía nómina por el valor de reparación o reposición.\n\n{{SALTO_DE_PAGINA}}\n\n4. Al momento de mi baja en la empresa o cuando el área de Sistemas lo solicite, me comprometo a devolver estos equipos en las mismas condiciones funcionales en las que los recibí (salvo el desgaste por uso normal).\n\nFecha de emisión: {{FECHA}}\n\n\n{{ESPACIO_FIRMA}}\nFirma de Conformidad\n{{ASIGNADO_A}}"
  );

  // --- MOCK DATA: Activos ---
  const [activos, setActivos] = useState([
    {
      id: 1, serie: 'LT-DELL-042', modelo: 'Latitude 5420', categoria: 'Computadoras', marca: 'Dell',
      asignado_a: 'María López', departamento: 'Contabilidad', estatus: 'Activo', prox_mantenimiento: '2026-06-15', proveedor: 'Dell Directo',
      fecha_compra: '2023-04-20', anios_garantia: 3, costo: 18500,
      software_instalado: ['Windows 11 Pro', 'Office 365 E3', 'Antivirus ESET'],
      historial: [
        { id: 101, fecha: '20 Abr 2023, 10:00 AM', accion: 'Compra y Alta', usuario_involucrado: 'Admin Sistema', notas: 'Compra directa a Dell.' },
        { id: 102, fecha: '25 Abr 2023, 12:30 PM', accion: 'Asignación Inicial', usuario_involucrado: 'María López', notas: 'Entregado con cargador original.' }
      ]
    },
    {
      id: 2, serie: 'CEL-IPH-012', modelo: 'iPhone 13', categoria: 'Celulares', marca: 'Apple',
      asignado_a: 'Juan Pérez', departamento: 'Ventas', estatus: 'Activo', prox_mantenimiento: null, proveedor: 'Telcel Corporativo',
      fecha_compra: '2024-02-15', anios_garantia: 1, costo: 15000,
      software_instalado: [],
      historial: [
        { id: 201, fecha: '10 Ene 2024, 09:00 AM', accion: 'Compra y Alta', usuario_involucrado: 'Admin Sistema', notas: 'Renovación de plan.' }
      ]
    },
    {
      id: 3, serie: 'MN-SAMSUNG-99', modelo: 'Monitor Curvo 24"', categoria: 'Perifericos', marca: 'Samsung',
      asignado_a: 'Sin Asignar', departamento: 'Sistemas', estatus: 'Disponible', prox_mantenimiento: null, proveedor: 'Amazon Business',
      fecha_compra: '2026-01-05', anios_garantia: 1, costo: 3500,
      software_instalado: [],
      historial: [
        { id: 301, fecha: '05 Ene 2026, 11:00 AM', accion: 'Compra y Alta', usuario_involucrado: 'Admin Sistema', notas: 'Ingreso a almacén.' }
      ]
    }
  ]);

  // Estados de la vista principal
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [pestañaActiva, setPestañaActiva] = useState('detalles');

  // Estados para Modales
  const [mostrarModalAlta, setMostrarModalAlta] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalReasignar, setMostrarModalReasignar] = useState(false);
  const [mostrarModalCatalogos, setMostrarModalCatalogos] = useState(false);
  const [activoParaResguardo, setActivoParaResguardo] = useState(null);

  // ESTADOS DE FIRMA DIGITAL
  const [mostrarModalFirma, setMostrarModalFirma] = useState(false);
  const [firmaDigital, setFirmaDigital] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  const [editandoEstatus, setEditandoEstatus] = useState(false);
  const [formEstatus, setFormEstatus] = useState({ nuevo_estatus: '', notas: '' });

  // Formularios
  const [formNuevoActivo, setFormNuevoActivo] = useState({ serie: '', modelo: '', marca: '', categoria: 'Computadoras', proveedor: '', fecha_compra: '', anios_garantia: 1, costo: '', prox_mantenimiento: '' });
  const [formEditarActivo, setFormEditarActivo] = useState(null);
  const [formReasignar, setFormReasignar] = useState({ nuevo_asignado: '', nuevo_departamento: '', notas: '' });
  const [nuevoSoftwareAsignar, setNuevoSoftwareAsignar] = useState("");

  const [pestañaCatalogo, setPestañaCatalogo] = useState('empresa');
  const [nuevoItemCatalogo, setNuevoItemCatalogo] = useState("");

  // Helpers
  const formatoMoneda = (monto) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);

  const getEstatusBadge = (estatus) => {
    const styles = { 'Activo': 'bg-green-500/10 text-green-400 border-green-500/20', 'Disponible': 'bg-blue-500/10 text-blue-400 border-blue-500/20', 'En Reparacion': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 'Dado de Baja': 'bg-red-500/10 text-red-400 border-red-500/20', 'Obsoleto': 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    return styles[estatus] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const getCategoriaIcon = (categoria) => {
    switch (categoria) {
      case 'Computadoras': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>;
      case 'Celulares': return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>;
      default: return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"></path></svg>;
    }
  };

  const calcularEstadoGarantia = (fechaCompra, aniosGarantia) => {
    if (!fechaCompra || !aniosGarantia) return { estado: 'Sin Dato', dias: null };
    const compra = new Date(fechaCompra);
    const vencimiento = new Date(compra.setFullYear(compra.getFullYear() + parseInt(aniosGarantia)));
    const hoy = new Date();
    const diferenciaMilisegundos = vencimiento - hoy;
    const diasRestantes = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    if (diasRestantes < 0) return { estado: 'Expirada', dias: diasRestantes, fechaVence: vencimiento.toLocaleDateString() };
    if (diasRestantes <= 30) return { estado: 'Por Expirar', dias: diasRestantes, fechaVence: vencimiento.toLocaleDateString() };
    return { estado: 'Vigente', dias: diasRestantes, fechaVence: vencimiento.toLocaleDateString() };
  };

  const activosFiltrados = filtroCategoria === 'Todas' ? activos : activos.filter(a => a.categoria === filtroCategoria);
  const formatFecha = () => new Date().toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // --- LÓGICA DE FIRMA DIGITAL (CANVAS) ---
  const getMousePos = (canvas, e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000"; // Tinta negra
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault(); // Evita scroll en móviles al firmar
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getMousePos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const limpiarFirma = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const guardarFirma = () => {
    const canvas = canvasRef.current;
    setFirmaDigital(canvas.toDataURL("image/png"));
    setMostrarModalFirma(false);
  };

  // --- PROCESAMIENTO DEL DOCUMENTO DE RESGUARDO ---
  const generarPaginasResguardo = (activo) => {
    if (!activo) return [];
    let texto = plantillaResguardo;
    texto = texto.replace(/{{ASIGNADO_A}}/g, activo.asignado_a);
    texto = texto.replace(/{{DEPARTAMENTO}}/g, activo.departamento);
    texto = texto.replace(/{{FECHA}}/g, new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }));
    return texto.split('{{SALTO_DE_PAGINA}}');
  };

  const renderizarContenidoDocumento = (textoPagina, activoResguardo) => {
    // Dividimos el texto usando los dos tokens especiales que tenemos
    const partes = textoPagina.split(/(\{\{TABLA_ACTIVOS\}\}|\{\{ESPACIO_FIRMA\}\})/g);

    return partes.map((parte, index) => {
      if (parte === '{{TABLA_ACTIVOS}}') {
        const misActivos = activos.filter(a => a.asignado_a === activoResguardo.asignado_a && a.asignado_a !== 'Sin Asignar');
        return (
          <table key={`tabla-${index}`} className="w-full text-sm border-collapse border border-slate-300 my-6 shadow-sm" style={{ fontSize: '13px' }}>
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border border-slate-300 p-3 text-left font-black">Categoría</th>
                <th className="border border-slate-300 p-3 text-left font-black">Marca y Modelo</th>
                <th className="border border-slate-300 p-3 text-left font-black">N° de Serie / ID</th>
              </tr>
            </thead>
            <tbody>
              {misActivos.map((a, i) => (
                <tr key={a.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border border-slate-300 p-3 font-semibold">{a.categoria}</td>
                  <td className="border border-slate-300 p-3">{a.marca} {a.modelo}</td>
                  <td className="border border-slate-300 p-3 font-mono">{a.serie}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      }

      if (parte === '{{ESPACIO_FIRMA}}') {
        return firmaDigital ? (
          <div key={`firma-${index}`} className="my-2">
            <img src={firmaDigital} alt="Firma Electrónica" className="h-20 object-contain mix-blend-multiply border-b border-black w-64" />
          </div>
        ) : (
          <div key={`firma-${index}`} className="my-2">
            <span className="inline-block w-64 border-b border-black h-12 align-bottom mb-1"></span>
          </div>
        );
      }

      return <span key={`texto-${index}`}>{parte}</span>;
    });
  };

  const handleAgregarCatalogo = (e) => {
    e.preventDefault();
    if (!nuevoItemCatalogo.trim()) return;
    if (pestañaCatalogo === 'marcas' && !catalogoMarcas.includes(nuevoItemCatalogo)) setCatalogoMarcas([...catalogoMarcas, nuevoItemCatalogo.trim()]);
    else if (pestañaCatalogo === 'proveedores' && !catalogoProveedores.includes(nuevoItemCatalogo)) setCatalogoProveedores([...catalogoProveedores, nuevoItemCatalogo.trim()]);
    else if (pestañaCatalogo === 'software' && !catalogoSoftware.includes(nuevoItemCatalogo)) setCatalogoSoftware([...catalogoSoftware, nuevoItemCatalogo.trim()]);
    setNuevoItemCatalogo("");
  };

  const handleEliminarCatalogo = (itemEliminar) => {
    if (!window.confirm(`¿Seguro que deseas eliminar "${itemEliminar}" del catálogo?`)) return;
    if (pestañaCatalogo === 'marcas') setCatalogoMarcas(catalogoMarcas.filter(item => item !== itemEliminar));
    else if (pestañaCatalogo === 'proveedores') setCatalogoProveedores(catalogoProveedores.filter(item => item !== itemEliminar));
    else if (pestañaCatalogo === 'software') setCatalogoSoftware(catalogoSoftware.filter(item => item !== itemEliminar));
  };

  // --- ALTA DE ACTIVO ---
  const handleAltaActivo = (e) => {
    e.preventDefault();
    const nuevoActivo = {
      id: Date.now(),
      ...formNuevoActivo,
      costo: Number(formNuevoActivo.costo),
      asignado_a: 'Sin Asignar', departamento: 'Sistemas', estatus: 'Disponible', software_instalado: [],
      historial: [{ id: Date.now() + 1, fecha: formatFecha(), accion: 'Alta de Activo', usuario_involucrado: user?.nombre_completo || 'Admin', notas: `Ingresado al sistema por ${formatoMoneda(formNuevoActivo.costo)}.` }]
    };
    setActivos([nuevoActivo, ...activos]);
    setFormNuevoActivo({ serie: '', modelo: '', marca: '', categoria: 'Computadoras', proveedor: '', fecha_compra: '', anios_garantia: 1, costo: '', prox_mantenimiento: '' });
    setMostrarModalAlta(false);
  };

  // --- EDICIÓN DE ACTIVO ---
  const abrirModalEdicion = () => {
    setFormEditarActivo({ ...activoSeleccionado });
    setMostrarModalEditar(true);
  };

  const handleGuardarEdicion = (e) => {
    e.preventDefault();
    const nuevoHistorialEntry = { id: Date.now(), fecha: formatFecha(), accion: 'Edición de Datos', usuario_involucrado: user?.nombre_completo || 'Admin', notas: 'Se actualizaron los datos maestros del equipo.' };
    const activoModificado = { ...formEditarActivo, costo: Number(formEditarActivo.costo) };
    const activosActualizados = activos.map(a => a.id === formEditarActivo.id ? { ...activoModificado, historial: [nuevoHistorialEntry, ...a.historial] } : a);
    setActivos(activosActualizados);
    setActivoSeleccionado(activoModificado);
    setMostrarModalEditar(false);
  };

  const handleCambioUsuarioReasignar = (e) => {
    const nombreTecleado = e.target.value;
    const usuarioInfo = catalogoUsuarios.find(u => u.nombre === nombreTecleado);
    setFormReasignar({ ...formReasignar, nuevo_asignado: nombreTecleado, nuevo_departamento: usuarioInfo ? usuarioInfo.departamento : '' });
  };

  const handleReasignar = (e) => {
    e.preventDefault();
    const usuarioValido = catalogoUsuarios.find(u => u.nombre === formReasignar.nuevo_asignado);
    if (!usuarioValido) { alert("⚠️ Error: El usuario ingresado no existe en el Directorio.\n\nPor favor, selecciona un usuario de la lista."); return; }

    const nuevoHistorialEntry = { id: Date.now(), fecha: formatFecha(), accion: 'Reasignación de Equipo', usuario_involucrado: formReasignar.nuevo_asignado, notas: `Entregado por ${user?.nombre_completo || 'Admin'}. Notas: ${formReasignar.notas}` };
    let activoActualizadoParaResguardo = null;

    const activosActualizados = activos.map(a => {
      if (a.id === activoSeleccionado.id) {
        const activoActualizado = { ...a, asignado_a: formReasignar.nuevo_asignado, departamento: formReasignar.nuevo_departamento, estatus: 'Activo', historial: [nuevoHistorialEntry, ...a.historial] };
        setActivoSeleccionado(activoActualizado);
        activoActualizadoParaResguardo = activoActualizado;
        return activoActualizado;
      }
      return a;
    });

    setActivos(activosActualizados);
    setFormReasignar({ nuevo_asignado: '', nuevo_departamento: '', notas: '' });
    setMostrarModalReasignar(false);
    setPestañaActiva('detalles');
    if (activoActualizadoParaResguardo) {
      setFirmaDigital(null); // Reseteamos la firma para el nuevo resguardo
      setActivoParaResguardo(activoActualizadoParaResguardo);
    }
  };

  const handleCambiarEstatus = (e) => {
    e.preventDefault();
    let nuevoAsignado = activoSeleccionado.asignado_a;
    let nuevoDepartamento = activoSeleccionado.departamento;
    let advertenciaDesasignacion = "";

    if (['Disponible', 'Dado de Baja', 'Obsoleto'].includes(formEstatus.nuevo_estatus)) {
      if (nuevoAsignado !== 'Sin Asignar') {
        advertenciaDesasignacion = ` Se retiró la asignación de ${nuevoAsignado}.`;
        nuevoAsignado = 'Sin Asignar';
        nuevoDepartamento = 'Sistemas';
      }
    }

    const nuevoHistorialEntry = { id: Date.now(), fecha: formatFecha(), accion: `Cambio de Estado: ${formEstatus.nuevo_estatus}`, usuario_involucrado: user?.nombre_completo || 'Admin', notas: `${formEstatus.notas}.${advertenciaDesasignacion}` };
    const activosActualizados = activos.map(a => a.id === activoSeleccionado.id ? { ...a, estatus: formEstatus.nuevo_estatus, asignado_a: nuevoAsignado, departamento: nuevoDepartamento, historial: [nuevoHistorialEntry, ...a.historial] } : a);
    setActivos(activosActualizados);
    setEditandoEstatus(false);
    setFormEstatus({ nuevo_estatus: '', notas: '' });
  };

  const agregarSoftware = () => {
    if (!nuevoSoftwareAsignar) return;
    const activosActualizados = activos.map(a => a.id === activoSeleccionado.id ? { ...a, software_instalado: [...a.software_instalado, nuevoSoftwareAsignar], historial: [{ id: Date.now(), fecha: formatFecha(), accion: 'Instalación de Software', usuario_involucrado: user?.nombre_completo || 'Admin', notas: `Asignación de: ${nuevoSoftwareAsignar}` }, ...a.historial] } : a);
    setActivos(activosActualizados);
    setNuevoSoftwareAsignar("");
  };

  const quitarSoftware = (software) => {
    if (!window.confirm(`¿Estás seguro de desasignar la licencia de ${software} de este equipo?`)) return;
    const activosActualizados = activos.map(a => a.id === activoSeleccionado.id ? { ...a, software_instalado: a.software_instalado.filter(s => s !== software), historial: [{ id: Date.now(), fecha: formatFecha(), accion: 'Remoción de Software', usuario_involucrado: user?.nombre_completo || 'Admin', notas: `Se removió la licencia de: ${software}` }, ...a.historial] } : a);
    setActivos(activosActualizados);
  };

  const contarActivosDelUsuario = (nombre) => {
    if (nombre === 'Sin Asignar') return 0;
    return activos.filter(a => a.asignado_a === nombre).length;
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">CMDB e Inventario</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Gestión de Hardware, Software, Garantías y Resguardos.</p>
        </div>
        <div className="flex items-center gap-3">
          {['Admin', 'Tecnico'].includes(user?.rol) && (
            <button onClick={() => setMostrarModalCatalogos(true)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition border border-slate-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
              Ajustes
            </button>
          )}
          <button onClick={() => { setFormNuevoActivo({ serie: '', modelo: '', marca: '', categoria: 'Computadoras', proveedor: '', fecha_compra: '', anios_garantia: 1, costo: '', prox_mantenimiento: '' }); setMostrarModalAlta(true); }} className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-900/50 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Alta de Activo
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-2 print:hidden">
        {['Todas', 'Computadoras', 'Celulares', 'Lineas', 'Perifericos'].map(cat => (
          <button key={cat} onClick={() => setFiltroCategoria(cat)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition whitespace-nowrap flex items-center gap-2 ${filtroCategoria === cat ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 shadow-sm' : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'}`}>
            {cat !== 'Todas' && getCategoriaIcon(cat)} {cat}
          </button>
        ))}
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm print:hidden">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <th className="p-4 pl-6">N° Serie / Etiqueta</th><th className="p-4">Modelo y Marca</th><th className="p-4">Asignado a</th><th className="p-4">Estado Garantía</th><th className="p-4">Estatus</th><th className="p-4 text-right pr-6">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {activosFiltrados.map((activo) => {
                const garantia = calcularEstadoGarantia(activo.fecha_compra, activo.anios_garantia);
                return (
                  <tr key={activo.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4 pl-6 font-bold text-white flex items-center gap-3"><div className="p-2 bg-slate-800 rounded border border-slate-700 text-cyan-500">{getCategoriaIcon(activo.categoria)}</div>{activo.serie}</td>
                    <td className="p-4"><p className="font-bold text-slate-200 mb-0.5">{activo.modelo}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{activo.marca}</p></td>
                    <td className="p-4"><p className={`font-bold ${activo.asignado_a === 'Sin Asignar' ? 'text-slate-500 italic' : 'text-slate-300'} mb-0.5`}>{activo.asignado_a}</p><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{activo.departamento}</p></td>
                    <td className="p-4">
                      {garantia.estado === 'Por Expirar' && <div className="flex items-center gap-1.5 text-orange-400 font-bold text-xs bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 inline-flex">Expira en {garantia.dias} días</div>}
                      {garantia.estado === 'Expirada' && <div className="flex items-center gap-1.5 text-red-500 font-bold text-xs">Expirada</div>}
                      {garantia.estado === 'Vigente' && <div className="flex items-center gap-1.5 text-green-500 font-bold text-xs">Vigente ({garantia.dias} días)</div>}
                      {garantia.estado === 'Sin Dato' && <span className="text-slate-600 text-xs font-bold">N/A</span>}
                    </td>
                    <td className="p-4"><span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border uppercase ${getEstatusBadge(activo.estatus)}`}>{activo.estatus}</span></td>
                    <td className="p-4 text-right pr-6"><button onClick={() => { setActivoSeleccionado(activo); setPestañaActiva('detalles'); setMostrarModalReasignar(false); setEditandoEstatus(false); }} className="text-cyan-400 hover:text-white transition font-bold text-[10px] uppercase tracking-widest bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded">Inspeccionar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================= */}
      {/* MODAL GESTOR DE CATÁLOGOS                 */}
      {/* ========================================= */}
      {mostrarModalCatalogos && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity print:hidden">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-700 rounded-lg border border-slate-600 text-slate-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg></div>
                <div><h2 className="text-lg font-black text-white">Ajustes Generales</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catálogos y Documentos</p></div>
              </div>
              <button onClick={() => setMostrarModalCatalogos(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="flex border-b border-slate-800 px-6 pt-4 gap-6 bg-slate-900 overflow-x-auto custom-scrollbar">
              <button onClick={() => setPestañaCatalogo('empresa')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${pestañaCatalogo === 'empresa' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Empresa</button>
              <button onClick={() => setPestañaCatalogo('marcas')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${pestañaCatalogo === 'marcas' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Marcas</button>
              <button onClick={() => setPestañaCatalogo('proveedores')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${pestañaCatalogo === 'proveedores' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Proveedores</button>
              <button onClick={() => setPestañaCatalogo('resguardo')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${pestañaCatalogo === 'resguardo' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Plantilla PDF</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30 flex flex-col">
              {pestañaCatalogo === 'empresa' && (
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-700 p-5 rounded-xl">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg> Identidad Visual</h3>
                    <div className="space-y-4">
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nombre Oficial</label><input type="text" value={configEmpresa.nombre} onChange={(e) => setConfigEmpresa({ ...configEmpresa, nombre: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500" /></div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">URL del Logo</label><input type="text" value={configEmpresa.logoUrl} onChange={(e) => setConfigEmpresa({ ...configEmpresa, logoUrl: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-cyan-500" /></div>
                    </div>
                  </div>
                </div>
              )}
              {['marcas', 'proveedores'].includes(pestañaCatalogo) && (
                <>
                  <form onSubmit={handleAgregarCatalogo} className="mb-6 bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <div className="flex gap-2">
                      <input type="text" value={nuevoItemCatalogo} onChange={(e) => setNuevoItemCatalogo(e.target.value)} placeholder="Agregar nuevo..." className="flex-1 bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 outline-none" />
                      <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase transition">Añadir</button>
                    </div>
                  </form>
                  <div className="space-y-2">
                    {(pestañaCatalogo === 'marcas' ? catalogoMarcas : catalogoProveedores).map(item => (
                      <div key={item} className="flex justify-between items-center bg-slate-800/50 px-4 py-2.5 rounded-lg border border-slate-700/50 group"><span className="text-sm font-bold text-slate-200">{item}</span><button onClick={() => handleEliminarCatalogo(item)} className="text-slate-500 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>
                    ))}
                  </div>
                </>
              )}
              {pestañaCatalogo === 'resguardo' && (
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 p-3 rounded-t-xl mb-0 border-b-0">
                    <button onClick={() => setDocStyle({ ...docStyle, fontSize: Math.max(10, docStyle.fontSize - 1) })} className="w-8 h-8 bg-slate-800 hover:bg-cyan-600 text-white rounded">-</button>
                    <span className="text-white text-xs font-bold w-6 text-center">{docStyle.fontSize}</span>
                    <button onClick={() => setDocStyle({ ...docStyle, fontSize: Math.min(24, docStyle.fontSize + 1) })} className="w-8 h-8 bg-slate-800 hover:bg-cyan-600 text-white rounded">+</button>
                    <div className="w-px h-6 bg-slate-700 mx-2"></div>
                    <button onClick={() => setDocStyle({ ...docStyle, textAlign: 'left' })} className={`w-8 h-8 rounded ${docStyle.textAlign === 'left' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>L</button>
                    <button onClick={() => setDocStyle({ ...docStyle, textAlign: 'justify' })} className={`w-8 h-8 rounded ${docStyle.textAlign === 'justify' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>J</button>
                  </div>
                  <textarea value={plantillaResguardo} onChange={(e) => setPlantillaResguardo(e.target.value)} className="flex-1 w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm p-4 outline-none rounded-b-xl" style={{ minHeight: '300px' }}></textarea>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900">
              <button onClick={() => setMostrarModalCatalogos(false)} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition">Cerrar Ajustes</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL ALTA Y EDICIÓN DE ACTIVO (Reducido por brevedad en este bloque) */}
      {/* ========================================= */}
      {(mostrarModalAlta || mostrarModalEditar) && (
        <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity print:hidden">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${mostrarModalAlta ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <div><h2 className="text-lg font-black text-white">{mostrarModalAlta ? 'Alta de Nuevo Activo' : 'Editar Datos Maestros'}</h2></div>
              </div>
              <button onClick={() => { setMostrarModalAlta(false); setMostrarModalEditar(false); }} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="form-activo" onSubmit={mostrarModalAlta ? handleAltaActivo : handleGuardarEdicion} className="space-y-5">
                {/* Aquí van los campos del form. Usando una variable temporal para acortar */}
                {(() => {
                  const estadoF = mostrarModalAlta ? formNuevoActivo : formEditarActivo;
                  const setEstadoF = mostrarModalAlta ? setFormNuevoActivo : setFormEditarActivo;
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">N° de Serie *</label><input type="text" required value={estadoF.serie} onChange={(e) => setEstadoF({ ...estadoF, serie: e.target.value.toUpperCase() })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500 uppercase" /></div>
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Categoría *</label><select value={estadoF.categoria} onChange={(e) => setEstadoF({ ...estadoF, categoria: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500"><option value="Computadoras">Computadoras</option><option value="Celulares">Celulares</option><option value="Perifericos">Periféricos</option></select></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Marca *</label><select required value={estadoF.marca} onChange={(e) => setEstadoF({ ...estadoF, marca: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500"><option value="" disabled>Selecciona...</option>{catalogoMarcas.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Modelo *</label><input type="text" required value={estadoF.modelo} onChange={(e) => setEstadoF({ ...estadoF, modelo: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500" /></div>
                      </div>
                      <div><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Proveedor *</label><select required value={estadoF.proveedor} onChange={(e) => setEstadoF({ ...estadoF, proveedor: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-lg px-4 py-3 outline-none focus:border-cyan-500"><option value="" disabled>Selecciona...</option>{catalogoProveedores.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                      <div className={`grid grid-cols-2 gap-4 p-4 rounded-xl border ${mostrarModalAlta ? 'bg-cyan-900/10 border-cyan-900/30' : 'bg-slate-800/50 border-slate-700'}`}>
                        <div className="col-span-2"><label className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2 block">Costo de Adquisición (MXN) *</label><input type="number" step="0.01" min="0" required value={estadoF.costo} onChange={(e) => setEstadoF({ ...estadoF, costo: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-mono rounded-lg px-4 py-3 outline-none focus:border-cyan-500" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Fecha de Compra *</label><input type="date" required value={estadoF.fecha_compra} onChange={(e) => setEstadoF({ ...estadoF, fecha_compra: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500" /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Años de Garantía *</label><input type="number" min="0" required value={estadoF.anios_garantia} onChange={(e) => setEstadoF({ ...estadoF, anios_garantia: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-4 py-3 outline-none focus:border-cyan-500" /></div>
                      </div>
                    </>
                  )
                })()}
              </form>
            </div>
            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button onClick={() => { setMostrarModalAlta(false); setMostrarModalEditar(false); }} className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 transition">Cancelar</button>
              <button form="form-activo" type="submit" className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg text-white ${mostrarModalAlta ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-yellow-600 hover:bg-yellow-500'}`}>{mostrarModalAlta ? 'Guardar Activo' : 'Actualizar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DETALLES / REASIGNAR DEL ACTIVO */}
      {activoSeleccionado && !activoParaResguardo && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity print:hidden">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col h-full animate-slide-in-right">
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-start bg-slate-800/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 mb-2 inline-block">{activoSeleccionado.categoria}</span>
                <div className="flex items-center gap-3"><h2 className="text-2xl font-black text-white mb-1">{activoSeleccionado.modelo}</h2><button onClick={abrirModalEdicion} className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white p-1.5 rounded transition shadow" title="Editar Datos Maestros"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button></div>
                <p className="text-sm font-bold text-slate-400 font-mono">SN: {activoSeleccionado.serie}</p>
              </div>
              <button onClick={() => { setActivoSeleccionado(null); setMostrarModalReasignar(false); setEditandoEstatus(false); }} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition z-10"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="flex border-b border-slate-800 px-6 pt-4 gap-6 bg-slate-900 overflow-x-auto custom-scrollbar">
              <button onClick={() => { setPestañaActiva('detalles'); setMostrarModalReasignar(false); }} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap ${pestañaActiva === 'detalles' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Hardware y Estado</button>
              {['Computadoras', 'Celulares'].includes(activoSeleccionado.categoria) && (
                <button onClick={() => { setPestañaActiva('software'); setMostrarModalReasignar(false); }} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${pestañaActiva === 'software' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Software <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px]">{activoSeleccionado.software_instalado?.length || 0}</span></button>
              )}
              <button onClick={() => { setPestañaActiva('historial'); setMostrarModalReasignar(false); }} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${pestañaActiva === 'historial' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>Historial <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[9px]">{activoSeleccionado.historial.length}</span></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">
              {pestañaActiva === 'detalles' && !mostrarModalReasignar && (
                <div className="space-y-6">
                  {/* Posesión y Resguardo */}
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Posesión Actual</h3>
                    <div className="flex justify-between items-center mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-black border-2 border-slate-600">{activoSeleccionado.asignado_a !== 'Sin Asignar' ? activoSeleccionado.asignado_a.charAt(0) : '?'}</div>
                        <div><p className={`font-bold text-sm ${activoSeleccionado.asignado_a === 'Sin Asignar' ? 'text-slate-400 italic' : 'text-white'}`}>{activoSeleccionado.asignado_a}</p><p className="text-xs text-slate-400">{activoSeleccionado.departamento}</p></div>
                      </div>
                      <button onClick={() => setMostrarModalReasignar(true)} className="bg-slate-900 hover:bg-slate-800 border border-slate-600 hover:border-cyan-500 hover:text-cyan-400 text-white px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition">Reasignar</button>
                    </div>
                    <button onClick={() => { setFirmaDigital(null); setActivoParaResguardo(activoSeleccionado); }} disabled={activoSeleccionado.asignado_a === 'Sin Asignar'} className="w-full bg-cyan-900/20 border border-cyan-500/30 hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 p-3 rounded-xl flex items-center justify-center gap-3 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      <span className="text-xs font-bold uppercase tracking-widest">Generar Resguardo ({contarActivosDelUsuario(activoSeleccionado.asignado_a)} equipos)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 border border-slate-800 bg-slate-900/50 p-5 rounded-xl">
                    <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proveedor / Marca</p><p className="text-sm font-bold text-slate-200">{activoSeleccionado.marca}</p><p className="text-[10px] text-slate-500">{activoSeleccionado.proveedor}</p></div>
                    <div className="text-right"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Costo de Adquisición</p><p className="text-lg font-black text-green-400 font-mono">{formatoMoneda(activoSeleccionado.costo)}</p></div>
                    <div className="col-span-2 bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center mt-2">
                      <div><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Garantía ({activoSeleccionado.anios_garantia} años)</p><p className="text-sm font-bold text-white">Comprado: {activoSeleccionado.fecha_compra}</p></div>
                      <div className="text-right">
                        {(() => {
                          const gar = calcularEstadoGarantia(activoSeleccionado.fecha_compra, activoSeleccionado.anios_garantia);
                          if (gar.estado === 'Por Expirar') return <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">Vence: {gar.fechaVence}</span>;
                          if (gar.estado === 'Expirada') return <span className="text-xs font-bold text-red-500">Expiró el {gar.fechaVence}</span>;
                          return <span className="text-xs font-bold text-green-500">Vigente hasta {gar.fechaVence}</span>;
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className={`border rounded-xl p-5 transition-colors ${editandoEstatus ? 'bg-slate-900 border-cyan-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
                    <div className="flex justify-between items-center mb-4"><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado Físico y Operativo</p>{!editandoEstatus ? (<button onClick={() => { setEditandoEstatus(true); setFormEstatus({ nuevo_estatus: activoSeleccionado.estatus, notas: '' }); }} className="text-slate-400 hover:text-cyan-400 text-xs font-bold uppercase tracking-widest transition">Modificar</button>) : (<button onClick={() => setEditandoEstatus(false)} className="text-slate-400 hover:text-red-400 text-xs font-bold uppercase tracking-widest transition">Cancelar</button>)}</div>
                    {!editandoEstatus ? (<div><span className={`px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest border uppercase inline-block ${getEstatusBadge(activoSeleccionado.estatus)}`}>{activoSeleccionado.estatus}</span></div>) : (
                      <form onSubmit={handleCambiarEstatus} className="space-y-4">
                        <select required value={formEstatus.nuevo_estatus} onChange={(e) => setFormEstatus({ ...formEstatus, nuevo_estatus: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-lg px-3 py-2 outline-none focus:border-cyan-500">
                          <option value="Activo">Activo (En uso)</option><option value="Disponible">Disponible (En almacén)</option><option value="En Reparacion">En Reparación</option><option value="Obsoleto">Obsoleto</option><option value="Dado de Baja">Dado de Baja</option>
                        </select>
                        <textarea required value={formEstatus.notas} onChange={(e) => setFormEstatus({ ...formEstatus, notas: e.target.value })} placeholder="Motivo o diagnóstico..." className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none h-20 resize-none"></textarea>
                        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg font-bold text-xs uppercase transition">Guardar Estado</button>
                      </form>
                    )}
                  </div>
                </div>
              )}
              {/* Vistas omitidas (software, reasignar, historial) ya funcionales */}
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* VISTA DE IMPRESIÓN DEL RESGUARDO          */}
      {/* ========================================= */}
      {activoParaResguardo && (
        <div className="fixed inset-0 z-[90] flex justify-center items-start pt-10 pb-10 bg-slate-950/90 backdrop-blur-md overflow-y-auto print:bg-white print:pt-0 print:pb-0">
          <div className="w-full max-w-3xl bg-white text-black min-h-[800px] shadow-2xl relative print:shadow-none print:m-0">

            {/* BOTONES DE ACCIÓN (Solo visibles en pantalla) */}
            <div className="absolute top-4 right-4 flex gap-2 print:hidden z-10">
              <button onClick={() => setMostrarModalFirma(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                Firmar Digitalmente
              </button>
              <button onClick={() => window.print()} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-bold text-xs flex items-center gap-2 shadow-lg"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg> Imprimir PDF</button>
              <button onClick={() => setActivoParaResguardo(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded font-bold text-xs">Cerrar</button>
            </div>

            {/* DOCUMENTO RENDERIZADO */}
            {generarPaginasResguardo(activoParaResguardo).map((textoPagina, i, arr) => (
              <div key={i} className={`p-12 print:p-0 print:m-0 ${i > 0 ? 'salto-pagina mt-8 print:mt-0 border-t-8 border-dashed border-slate-200 print:border-none' : ''}`}>
                <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-8">
                  <div className="flex items-center gap-5">
                    {configEmpresa.logoUrl && <img src={configEmpresa.logoUrl} alt="Logo" className="h-16 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />}
                    <div><h1 className="text-2xl font-black">{configEmpresa.nombre || 'Nombre de Empresa'}</h1><p className="text-sm font-medium text-slate-600">Departamento de TI</p></div>
                  </div>
                  <div className="text-right"><p className="text-xs font-bold text-slate-500">Folio: RESP-{activoParaResguardo.asignado_a.replace(/\s+/g, '').toUpperCase()}</p></div>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed min-h-[500px]" style={{ fontSize: `${docStyle.fontSize}px`, textAlign: docStyle.textAlign, fontFamily: 'system-ui, sans-serif' }}>
                  {renderizarContenidoDocumento(textoPagina.trim(), activoParaResguardo)}
                </div>
                <div className="mt-12 pt-8 border-t border-slate-300 flex justify-between items-center text-xs text-slate-500">
                  <div><p>Documento interno. Generado por CMDB.</p></div>
                  <div className="font-bold">Página {i + 1} de {arr.length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL: PAD DE FIRMA DIGITAL (CANVAS)      */}
      {/* ========================================= */}
      {mostrarModalFirma && (
        <div className="fixed inset-0 z-[110] flex justify-center items-center bg-slate-950/90 backdrop-blur-sm print:hidden p-4">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-slide-in-right">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div>
                <h3 className="text-lg font-black text-white">Firma Electrónica</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Dibuja tu firma en el recuadro blanco</p>
              </div>
              <button onClick={() => setMostrarModalFirma(false)} className="text-slate-400 hover:text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>

            <div className="p-6 flex flex-col items-center bg-slate-800">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="bg-white rounded-lg border-2 border-slate-300 cursor-crosshair touch-none w-full max-w-[400px] shadow-inner"
              />
              <div className="w-full flex justify-end mt-3">
                <button onClick={limpiarFirma} className="text-xs font-bold text-slate-400 hover:text-red-400 uppercase tracking-widest transition flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg> Limpiar Lienzo
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-900 flex gap-3">
              <button onClick={() => setMostrarModalFirma(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition">Cancelar</button>
              <button onClick={guardarFirma} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition shadow-lg">Guardar Firma</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:bg-white { background-color: white !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:m-0 { margin: 0 !important; }
          .print\\:pt-0 { padding-top: 0 !important; }
          .print\\:pb-0 { padding-bottom: 0 !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .fixed.z-\\[90\\] { position: absolute; left: 0; top: 0; width: 100%; height: auto; }
          .fixed.z-\\[90\\] * { visibility: visible; }
          .salto-pagina { page-break-before: always !important; break-before: page !important; }
        }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

export default Inventario;