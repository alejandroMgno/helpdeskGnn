import React, { useState, useEffect, useRef } from 'react';

const API_URL = 'http://localhost:8000/api/v1';

const Inventario = ({ token }) => {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('computadoras');
  
  // Listas de Base de Datos
  const [usuariosDb, setUsuariosDb] = useState([]); 
  const marcasDb = [{id: 1, nombre: 'Dell'}, {id: 2, nombre: 'Lenovo'}, {id: 3, nombre: 'Apple'}, {id: 4, nombre: 'HP'}, {id: 5, nombre: 'Samsung'}];
  const proveedoresDb = [{id: 1, nombre: 'PC Laptops S.A.'}, {id: 2, nombre: 'Telcel Corporativo'}, {id: 3, nombre: 'Syscom'}];

  // Estados del Modal
  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [facturaPdf, setFacturaPdf] = useState(null);
  
  const [nuevoActivo, setNuevoActivo] = useState({
    etiqueta_gnn: '', nombre: '', serie: '', categoria: 'computadoras', 
    frecuencia_meses: 0, usuario_id: '', marca_id: '', proveedor_id: ''
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchActivos();
    fetchUsuarios();
  }, [token]);

  const fetchActivos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/activos/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setActivos(await res.json());
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/usuarios/`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setUsuariosDb(await res.json());
    } catch (error) { console.error(error); }
  };

  const handleCrearActivo = async (e) => {
    e.preventDefault(); 
    
    if (!nuevoActivo.etiqueta_gnn.trim() || !nuevoActivo.nombre.trim()) {
      alert("⚠️ ERROR: La Etiqueta GNN y el Modelo son obligatorios."); 
      return;
    }
    
    setGuardando(true);

    const payload = {
      ...nuevoActivo,
      usuario_id: nuevoActivo.usuario_id ? parseInt(nuevoActivo.usuario_id) : null,
      marca_id: nuevoActivo.marca_id ? parseInt(nuevoActivo.marca_id) : null,
      proveedor_id: nuevoActivo.proveedor_id ? parseInt(nuevoActivo.proveedor_id) : null,
    };

    try {
      const res = await fetch(`${API_URL}/activos/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const dataActivo = await res.json();
        
        if (facturaPdf) {
          const formData = new FormData();
          formData.append('file', facturaPdf);
          await fetch(`${API_URL}/activos/${dataActivo.id}/factura`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
        }

        alert("✅ ¡Activo registrado exitosamente!");
        setShowModal(false);
        setNuevoActivo({ etiqueta_gnn: '', nombre: '', serie: '', categoria: 'computadoras', frecuencia_meses: 0, usuario_id: '', marca_id: '', proveedor_id: '' });
        setFacturaPdf(null);
        fetchActivos();
      } else {
        const err = await res.json(); alert(`Error: ${err.detail}`);
      }
    } catch (err) { alert("Error de red."); } 
    finally { setGuardando(false); }
  };

  const tabs = [
    { id: 'computadoras', label: 'COMPUTADORAS', icon: '💻' },
    { id: 'celulares', label: 'CELULARES', icon: '📱' },
    { id: 'lineas', label: 'LÍNEAS', icon: '📞' },
    { id: 'perifericos', label: 'PERIFÉRICOS', icon: '🖨️' },
  ];

  const activosFiltrados = activos.filter(a => a.categoria === categoriaActiva);

  return (
    <div className="animate-in fade-in duration-700 space-y-6 text-white w-full">
      
      {/* HEADER IDÉNTICO A TU IMAGEN 1 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">ITAM GNN</h1>
          <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-1">Gestión de Activos y Mantenimiento</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Input de Búsqueda */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="🔍 Buscar activo..." 
              className="bg-slate-900 border border-white/10 px-4 py-2.5 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 w-48 transition-all"
            />
          </div>
          
          {/* Botones de Acción */}
          <button className="flex items-center gap-2 bg-transparent border border-white/20 hover:bg-white/5 px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all">
            ⬇ Exportar Excel
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            + Agregar Activo
          </button>
        </div>
      </header>

      {/* TABS DE CATEGORÍAS IDÉNTICAS A TU IMAGEN 1 */}
      <div className="flex flex-wrap gap-3">
        {tabs.map(tab => (
          <button
            key={tab.id} 
            onClick={() => setCategoriaActiva(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              categoriaActiva === tab.id 
                ? 'bg-slate-800 border border-cyan-500/50 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]' 
                : 'bg-slate-900/50 border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-sm">{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* TABLA PRINCIPAL IDÉNTICA A TU IMAGEN 1 */}
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 text-slate-400 uppercase font-black tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4 px-6">Etiqueta</th>
                <th className="p-4">Equipo / Serie</th>
                <th className="p-4">Asignado a</th>
                <th className="p-4">Zona / Depto</th>
                <th className="p-4">Próx. Mantenimiento</th>
                <th className="p-4 text-right px-6">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? <tr><td colSpan="6" className="p-10 text-center font-bold text-cyan-400 uppercase tracking-widest">Cargando...</td></tr> : 
                activosFiltrados.length > 0 ? activosFiltrados.map(a => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 px-6 font-black text-cyan-400">{a.etiqueta}</td>
                    <td className="p-4">
                      <p className="font-bold text-white uppercase">{a.nombre}</p>
                      <p className="text-[10px] text-slate-500 uppercase mt-0.5">SN: {a.serie || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-slate-300 font-bold uppercase">{a.usuario}</td>
                    <td className="p-4 text-slate-300 font-bold uppercase">
                      {a.zona} <br/><span className="text-[9px] text-slate-500">{a.departamento}</span>
                    </td>
                    <td className="p-4">
                      {a.prox_mant !== 'N/A' ? (
                        <span className="px-3 py-1 bg-slate-800 border border-cyan-500/30 text-cyan-400 rounded-full text-[10px] font-black uppercase shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                          {a.prox_mant}
                        </span>
                      ) : <span className="text-slate-600 font-black text-[10px]">SIN MANTENIMIENTO</span>}
                    </td>
                    <td className="p-4 text-right px-6 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-cyan-400 hover:text-cyan-300 font-black text-[10px] uppercase tracking-widest bg-cyan-500/10 px-3 py-1.5 rounded-lg">Ver Detalle</button>
                      <button className="text-white hover:text-gray-300 font-black text-[10px] uppercase tracking-widest border border-white/20 px-3 py-1.5 rounded-lg">Responsiva</button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="6" className="p-10 text-center font-bold text-slate-500 uppercase tracking-widest">No hay {categoriaActiva} registrados</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL IDÉNTICO A TU IMAGEN 2 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6 border-b border-white/10 pb-4">
              Registrar Nuevo Equipo
            </h2>
            
            <form onSubmit={handleCrearActivo} className="space-y-6">
              
              {/* 1. DATOS DEL ACTIVO */}
              <div>
                <p className="text-cyan-400 text-[11px] font-black uppercase tracking-widest mb-4">1. Datos del Activo</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Etiqueta GNN</label>
                    <input type="text" placeholder="Ej. LAP-001" className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs outline-none uppercase focus:border-cyan-500/50 transition-colors" value={nuevoActivo.etiqueta_gnn} onChange={e => setNuevoActivo({...nuevoActivo, etiqueta_gnn: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Modelo / Nombre</label>
                    <input type="text" placeholder="Ej. ThinkPad T14" className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs outline-none focus:border-cyan-500/50 transition-colors" value={nuevoActivo.nombre} onChange={e => setNuevoActivo({...nuevoActivo, nombre: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">No. Serie</label>
                    <input type="text" placeholder="Número de serie" className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs outline-none uppercase focus:border-cyan-500/50 transition-colors" value={nuevoActivo.serie} onChange={e => setNuevoActivo({...nuevoActivo, serie: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Categoría</label>
                    <select className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs outline-none uppercase focus:border-cyan-500/50 transition-colors" value={nuevoActivo.categoria} onChange={e => setNuevoActivo({...nuevoActivo, categoria: e.target.value})}>
                      <option value="computadoras">Computadoras</option>
                      <option value="celulares">Celulares</option>
                      <option value="lineas">Líneas</option>
                      <option value="perifericos">Periféricos</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Marca</label>
                    <select className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs outline-none uppercase focus:border-cyan-500/50 transition-colors" value={nuevoActivo.marca_id} onChange={e => setNuevoActivo({...nuevoActivo, marca_id: e.target.value})}>
                      <option value="">Seleccionar...</option>
                      {marcasDb.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Mantenimiento</label>
                    <select className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-cyan-400 font-bold text-xs outline-none uppercase focus:border-cyan-500/50 transition-colors" value={nuevoActivo.frecuencia_meses} onChange={e => setNuevoActivo({...nuevoActivo, frecuencia_meses: parseInt(e.target.value)})}>
                      <option value={0} className="text-white">Sin Mantenimiento</option>
                      <option value={6} className="text-white">Cada 6 Meses</option>
                      <option value={12} className="text-white">Anual</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. ASIGNACIÓN */}
              <div className="pt-2 border-t border-white/5">
                <p className="text-cyan-400 text-[11px] font-black uppercase tracking-widest mb-4 mt-4">2. Asignación</p>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Asignar a Usuario</label>
                  <select className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs outline-none uppercase focus:border-cyan-500/50 transition-colors" value={nuevoActivo.usuario_id} onChange={e => setNuevoActivo({...nuevoActivo, usuario_id: e.target.value})}>
                    <option value="">Dejar en Almacén / Stock</option>
                    {usuariosDb.map(u => <option key={u.id} value={u.id}>{u.nombre} - {u.departamento}</option>)}
                  </select>
                </div>
              </div>
              
              {/* 3. COMPRAS Y PROVEEDOR */}
              <div className="pt-2 border-t border-white/5">
                <p className="text-cyan-400 text-[11px] font-black uppercase tracking-widest mb-4 mt-4">3. Compras y Proveedor</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Proveedor</label>
                    <select className="w-full bg-slate-950 border border-white/10 p-3 rounded-xl text-white text-xs outline-none uppercase focus:border-cyan-500/50 transition-colors" value={nuevoActivo.proveedor_id} onChange={e => setNuevoActivo({...nuevoActivo, proveedor_id: e.target.value})}>
                      <option value="">Seleccionar Proveedor...</option>
                      {proveedoresDb.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase ml-1 block mb-1">Factura</label>
                    <label className="flex items-center justify-center gap-3 w-full bg-slate-950 border border-dashed border-white/20 p-2.5 rounded-xl text-slate-400 text-xs uppercase tracking-widest cursor-pointer hover:border-cyan-500/50 hover:text-cyan-400 transition-all">
                      <span className="text-lg">📄</span>
                      <span className="truncate">{facturaPdf ? facturaPdf.name : 'Subir Factura (PDF)'}</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFacturaPdf(e.target.files[0])} />
                    </label>
                  </div>
                </div>
              </div>
              
              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-6 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/5 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[10px] px-8 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] uppercase tracking-widest disabled:opacity-50">
                  {guardando ? 'GUARDANDO...' : 'GUARDAR ACTIVO'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;