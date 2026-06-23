// frontend/src/views/configuracion.jsx
import React, { useState, useEffect } from 'react';
import clienteAxios from '../api/axios';

const Configuracion = ({ user }) => {
  const [activeTab, setActiveTab] = useState('sla');
  const [loading, setLoading] = useState(false);

  // Estados para catálogos
  const [marcas, setMarcas] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [slaConfigs, setSlaConfigs] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [puestos, setPuestos] = useState([]);

  const [smtpConfig, setSmtpConfig] = useState({
    smtp_host: '', smtp_port: 587, smtp_user: '', smtp_password: '', smtp_tls: true,
    emails_from_email: '', emails_from_name: '',
    notificar_ticket_creado: true, notificar_ticket_reasignado: true,
    notificar_ticket_cerrado: true, notificar_activo_asignado: true
  });
  
  // Estados para formularios
  const [nuevaMarca, setNuevaMarca] = useState({ nombre: '', descripcion: '' });
  const [nuevoProveedor, setNuevoProveedor] = useState({ 
    nombre: '', rfc: '', contacto_nombre: '', contacto_telefono: '', contacto_email: '', notas: '' 
  });
  const [nuevaCat, setNuevaCat] = useState({ nombre: '', icono: 'pi pi-box' });
  const [nuevaZona, setNuevaZona] = useState({ nombre: '' });
  const [nuevoCC, setNuevoCC] = useState({ codigo: '', nombre: '' });
  const [nuevoDep, setNuevoDep] = useState({ nombre: '', zona_id: '', centro_costo_id: '' });
  const [nuevoPuesto, setNuevoPuesto] = useState({ nombre: '' });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState(''); // 'marca', 'proveedor', 'cat', 'zona', 'cc', 'dep', 'puesto'
  const [editData, setEditData] = useState({});

  const openEditModal = (type, item) => {
    setEditType(type);
    setEditData({ ...item });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    let url = '';
    switch (editType) {
        case 'marca': url = `/catalogos/marcas/${editData.id}`; break;
        case 'proveedor': url = `/catalogos/proveedores/${editData.id}`; break;
        case 'cat': url = `/catalogos/categorias/${editData.id}`; break;
        case 'zona': url = `/catalogos/zonas/${editData.id}`; break;
        case 'cc': url = `/catalogos/centros-costo/${editData.id}`; break;
        case 'dep': url = `/catalogos/departamentos/${editData.id}`; break;
        case 'puesto': url = `/catalogos/puestos/${editData.id}`; break;
        case 'sla': url = `/catalogos/sla/${editData.id}`; break;
        default: return;
    }

    try {
        await clienteAxios.put(url, editData);
        alert("Actualizado correctamente.");
        setShowEditModal(false);
        fetchData();
    } catch (err) {
        alert("Error al actualizar.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resMarcas, resProv, resSla, resCat, resSmtp, resZonas, resCC, resDeps, resPuestos] = await Promise.all([
        clienteAxios.get('/catalogos/marcas'),
        clienteAxios.get('/catalogos/proveedores'),
        clienteAxios.get('/catalogos/sla'),
        clienteAxios.get('/catalogos/categorias'),
        clienteAxios.get('/config/smtp'),
        clienteAxios.get('/catalogos/zonas'),
        clienteAxios.get('/catalogos/centros-costo'),
        clienteAxios.get('/catalogos/departamentos'),
        clienteAxios.get('/catalogos/puestos')
      ]);
      setMarcas(resMarcas.data);
      setProveedores(resProv.data);
      setSlaConfigs(resSla.data);
      setCategorias(resCat.data);
      setSmtpConfig(resSmtp.data);
      setZonas(resZonas.data);
      setCentrosCosto(resCC.data);
      setDepartamentos(resDeps.data);
      setPuestos(resPuestos.data);
    } catch (error) {
      console.error("Error al cargar configuración:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handlers Organizacionales
  const handleCrearZona = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/catalogos/zonas', nuevaZona);
      setNuevaZona({ nombre: '' });
      fetchData();
    } catch (error) { alert("Error al crear zona"); }
  };

  const handleEliminarZona = async (id) => {
    if (!confirm("¿Eliminar zona?")) return;
    try {
      await clienteAxios.delete(`/catalogos/zonas/${id}`);
      fetchData();
    } catch (error) { alert("Error al eliminar. Verifique si tiene dependencias."); }
  };

  const handleCrearCC = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/catalogos/centros-costo', nuevoCC);
      setNuevoCC({ codigo: '', nombre: '' });
      fetchData();
    } catch (error) { alert("Error al crear Centro de Costo"); }
  };

  const handleEliminarCC = async (id) => {
    if (!confirm("¿Eliminar Centro de Costo?")) return;
    try {
      await clienteAxios.delete(`/catalogos/centros-costo/${id}`);
      fetchData();
    } catch (error) { alert("Error al eliminar."); }
  };

  const handleCrearDep = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/catalogos/departamentos', nuevoDep);
      setNuevoDep({ nombre: '', zona_id: '', centro_costo_id: '' });
      fetchData();
    } catch (error) { alert("Error al crear Departamento"); }
  };

  const handleEliminarDep = async (id) => {
    if (!confirm("¿Eliminar Departamento?")) return;
    try {
      await clienteAxios.delete(`/catalogos/departamentos/${id}`);
      fetchData();
    } catch (error) { alert("Error al eliminar."); }
  };

  const handleCrearPuesto = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/catalogos/puestos', nuevoPuesto);
      setNuevoPuesto({ nombre: '' });
      fetchData();
    } catch (error) { alert("Error al crear Puesto"); }
  };

  const handleEliminarPuesto = async (id) => {
    if (!confirm("¿Eliminar Puesto?")) return;
    try {
      await clienteAxios.delete(`/catalogos/puestos/${id}`);
      fetchData();
    } catch (error) { alert("Error al eliminar."); }
  };

  const handleCrearMarca = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/catalogos/marcas', nuevaMarca);
      setNuevaMarca({ nombre: '', descripcion: '' });
      fetchData();
      alert("Marca agregada correctamente.");
    } catch (error) {
      alert("Error al agregar marca.");
    }
  };

  const handleCrearProveedor = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/catalogos/proveedores', nuevoProveedor);
      setNuevoProveedor({ nombre: '', rfc: '', contacto_nombre: '', contacto_telefono: '', contacto_email: '', notas: '' });
      fetchData();
      alert("Proveedor agregado correctamente.");
    } catch (error) {
      alert("Error al agregar proveedor.");
    }
  };

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.post('/catalogos/categorias', nuevaCat);
      setNuevaCat({ nombre: '', icono: 'pi pi-box' });
      fetchData();
      alert("Categoría creada.");
    } catch (error) {
      alert("Error al crear categoría.");
    }
  };

  const handleUpdateSLA = (config) => {
    openEditModal('sla', config);
  };

  const handleEditarMarca = async (marca) => {
    const nuevoNombre = prompt("Nuevo nombre de la marca:", marca.nombre);
    if (!nuevoNombre) return;
    try {
      await clienteAxios.put(`/catalogos/marcas/${marca.id}`, { ...marca, nombre: nuevoNombre });
      fetchData();
    } catch (error) {
      alert("Error al editar marca.");
    }
  };

  const handleEliminarMarca = async (id) => {
    if (!confirm("¿Eliminar esta marca?")) return;
    try {
      await clienteAxios.delete(`/catalogos/marcas/${id}`);
      fetchData();
    } catch (error) {
      alert("Error al eliminar. Verifique si está en uso.");
    }
  };

  const handleEditarProveedor = async (p) => {
    const nuevoNombre = prompt("Nuevo nombre del proveedor:", p.nombre);
    if (!nuevoNombre) return;
    try {
      await clienteAxios.put(`/catalogos/proveedores/${p.id}`, { ...p, nombre: nuevoNombre });
      fetchData();
    } catch (error) {
      alert("Error al editar.");
    }
  };

  const handleEliminarProveedor = async (id) => {
    if (!confirm("¿Eliminar proveedor?")) return;
    try {
      await clienteAxios.delete(`/catalogos/proveedores/${id}`);
      fetchData();
    } catch (error) {
      alert("Error al eliminar.");
    }
  };

  const handleEditarCat = async (c) => {
    const nuevoNombre = prompt("Nuevo nombre de categoría:", c.nombre);
    if (!nuevoNombre) return;
    try {
      await clienteAxios.put(`/catalogos/categorias/${c.id}`, { ...c, nombre: nuevoNombre });
      fetchData();
    } catch (error) {
      alert("Error al editar.");
    }
  };

  const handleEliminarCat = async (id) => {
    if (!confirm("¿Eliminar categoría?")) return;
    try {
      await clienteAxios.delete(`/catalogos/categorias/${id}`);
      fetchData();
    } catch (error) {
      alert("Error al eliminar.");
    }
  };

  const handleSeedSLA = async () => {
    try {
      await clienteAxios.post('/catalogos/sla/seed');
      fetchData();
      alert("Valores iniciales cargados.");
    } catch (error) {
      alert("Error al cargar valores.");
    }
  };

  const renderEstructura = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Fila 1: Zonas y Centros de Costo (Bases) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ZONAS */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-600">Zonas / Sedes</h3>
          </div>
          <div className="p-4">
            <form onSubmit={handleCrearZona} className="flex gap-2 mb-4">
              <input type="text" required value={nuevaZona.nombre} onChange={e => setNuevaZona({nombre: e.target.value})} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Nombre de zona..." />
              <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm">+</button>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {zonas.map(z => (
                <div key={z.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 group">
                  <span className="text-sm font-medium text-slate-700">{z.nombre}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal('zona', z)} className="text-blue-500 hover:text-blue-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onClick={() => handleEliminarZona(z.id)} className="text-red-500 hover:text-red-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTROS DE COSTO */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-slate-600">Centros de Costo</h3>
          </div>
          <div className="p-4">
            <form onSubmit={handleCrearCC} className="grid grid-cols-1 gap-2 mb-4">
              <div className="flex gap-2">
                <input type="text" required value={nuevoCC.codigo} onChange={e => setNuevoCC({...nuevoCC, codigo: e.target.value})} className="w-24 border rounded px-3 py-1.5 text-sm font-mono" placeholder="Código" />
                <input type="text" required value={nuevoCC.nombre} onChange={e => setNuevoCC({...nuevoCC, nombre: e.target.value})} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Nombre..." />
                <button type="submit" className="bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold shadow-sm">+</button>
              </div>
            </form>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {centrosCosto.map(cc => (
                <div key={cc.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 group">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 font-mono leading-tight">{cc.codigo}</span>
                    <span className="text-sm font-medium text-slate-700 leading-tight">{cc.nombre}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal('cc', cc)} className="text-blue-500 hover:text-blue-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onClick={() => handleEliminarCC(cc.id)} className="text-red-500 hover:text-red-700"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fila 2: Departamentos (Ligados) */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xs font-black uppercase text-slate-600">Departamentos (Relación Estructural)</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleCrearDep} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre Depto.</label>
              <input type="text" required value={nuevoDep.nombre} onChange={e => setNuevoDep({...nuevoDep, nombre: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Ej. Sistemas" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Zona / Sede</label>
              <select required value={nuevoDep.zona_id} onChange={e => setNuevoDep({...nuevoDep, zona_id: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm bg-white">
                <option value="">Seleccionar...</option>
                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">C. Costo Relacionado</label>
              <select required value={nuevoDep.centro_costo_id} onChange={e => setNuevoDep({...nuevoDep, centro_costo_id: e.target.value})} className="w-full border rounded px-3 py-1.5 text-sm bg-white">
                <option value="">Seleccionar...</option>
                {centrosCosto.map(cc => <option key={cc.id} value={cc.id}>{cc.codigo} - {cc.nombre}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-bold shadow-sm hover:bg-indigo-700 transition">Vincular Estructura</button>
            </div>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departamentos.map(d => (
              <div key={d.id} className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow group relative">
                <div className="mb-2">
                  <h4 className="text-sm font-bold text-slate-800">{d.nombre}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100">
                    Sede: {d.zona?.nombre}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100">
                    CC: {d.centro_costo?.codigo}
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal('dep', d)} className="p-1.5 text-blue-400 hover:text-blue-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onClick={() => handleEliminarDep(d.id)} className="p-1.5 text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila 3: Puestos */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <h3 className="text-xs font-black uppercase text-slate-600">Catálogo de Puestos</h3>
        </div>
        <div className="p-4">
          <form onSubmit={handleCrearPuesto} className="flex gap-2 mb-4 max-w-md">
            <input type="text" required value={nuevoPuesto.nombre} onChange={e => setNuevoPuesto({nombre: e.target.value})} className="flex-1 border rounded px-3 py-1.5 text-sm" placeholder="Nuevo puesto..." />
            <button type="submit" className="bg-slate-800 text-white px-4 py-1.5 rounded text-xs font-bold">Agregar</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {puestos.map(p => (
              <div key={p.id} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full flex items-center gap-2 group">
                <span className="text-xs font-bold text-slate-600">{p.nombre}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal('puesto', p)} className="text-blue-400 hover:text-blue-600 transition-colors"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                    <button onClick={() => handleEliminarPuesto(p.id)} className="text-slate-400 hover:text-red-500 transition-colors"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSLAConfig = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <th className="p-4 pl-6">Prioridad</th>
            <th className="p-4">Tiempo de Resolución</th>
            <th className="p-4">Descripción de Servicio</th>
            <th className="p-4 text-right pr-6">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {slaConfigs.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-10 text-center">
                <p className="text-slate-500 italic mb-4">No se han encontrado políticas de SLA configuradas.</p>
                <button onClick={handleSeedSLA} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold transition shadow-sm">
                  Cargar Valores Iniciales
                </button>
              </td>
            </tr>
          ) : (
            slaConfigs.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${
                      s.prioridad === 'Crítica' ? 'bg-red-500' : 
                      s.prioridad === 'Alta' ? 'bg-orange-500' : 
                      s.prioridad === 'Media' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}></div>
                    <span className="font-bold text-slate-800">{s.prioridad}</span>
                  </div>
                </td>
                <td className="p-4 font-bold text-slate-700">{s.horas} Horas</td>
                <td className="p-4 text-slate-500 text-xs italic">{s.descripcion}</td>
                <td className="p-4 text-right pr-6">
                  <button onClick={() => handleUpdateSLA(s)} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors uppercase tracking-widest">
                    Editar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderMarcas = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-fit sticky top-0">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Nueva Marca</h3>
        <form onSubmit={handleCrearMarca} className="space-y-4">
          <input type="text" required value={nuevaMarca.nombre} onChange={e => setNuevaMarca({...nuevaMarca, nombre: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Nombre..." />
          <textarea value={nuevaMarca.descripcion} onChange={e => setNuevaMarca({...nuevaMarca, descripcion: e.target.value})} className="w-full border rounded px-3 py-2 text-sm h-24" placeholder="Descripción..."></textarea>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded text-xs font-bold transition shadow">Guardar</button>
        </form>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b"><tr><th className="px-5 py-3 text-[11px] font-black uppercase text-slate-500">Nombre</th><th className="px-5 py-3 text-[11px] font-black uppercase text-slate-500">Descripción</th><th className="px-5 py-3 text-[11px] font-black uppercase text-slate-500 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{marcas.map(m => (
            <tr key={m.id} className="hover:bg-slate-50">
              <td className="px-5 py-4 text-sm font-bold text-slate-700">{m.nombre}</td>
              <td className="px-5 py-4 text-xs text-slate-500">{m.descripcion || '-'}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => openEditModal('marca', m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                  <button onClick={() => handleEliminarMarca(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderProveedores = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-fit sticky top-0">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Nuevo Proveedor</h3>
        <form onSubmit={handleCrearProveedor} className="space-y-4">
          <input type="text" required value={nuevoProveedor.nombre} onChange={e => setNuevoProveedor({...nuevoProveedor, nombre: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Nombre..." />
          <input type="text" value={nuevoProveedor.rfc} onChange={e => setNuevoProveedor({...nuevoProveedor, rfc: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="RFC" />
          <input type="email" value={nuevoProveedor.contacto_email} onChange={e => setNuevoProveedor({...nuevoProveedor, contacto_email: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Email" />
          <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded text-xs font-bold transition shadow">Guardar</button>
        </form>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b"><tr><th className="px-5 py-3 text-[11px] font-black uppercase text-slate-500">Proveedor</th><th className="px-5 py-3 text-[11px] font-black uppercase text-slate-500">RFC</th><th className="px-5 py-3 text-[11px] font-black uppercase text-slate-500 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{proveedores.map(p => (
            <tr key={p.id} className="hover:bg-slate-50">
              <td className="px-5 py-4 text-sm font-bold text-slate-700">{p.nombre}</td>
              <td className="px-5 py-4 text-xs font-mono">{p.rfc || '-'}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button onClick={() => openEditModal('proveedor', p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                  <button onClick={() => handleEliminarProveedor(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );

  const renderCategorias = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 h-fit sticky top-0">
        <h3 className="text-sm font-bold text-slate-800 mb-4 text-indigo-600">Nueva Categoría de Activo</h3>
        <form onSubmit={handleCrearCategoria} className="space-y-4">
          <input type="text" required value={nuevaCat.nombre} onChange={e => setNuevaCat({...nuevaCat, nombre: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="Ej. Laptops, Monitores..." />
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-bold transition shadow">Guardar Categoría</button>
        </form>
      </div>
      <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6">
          {categorias.map(c => (
            <div key={c.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm"><i className={c.icono}></i></div>
                <span className="text-sm font-bold text-slate-700">{c.nombre}</span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal('cat', c)} className="p-1 text-blue-600 hover:bg-blue-100 rounded"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                <button onClick={() => handleEliminarCat(c.id)} className="p-1 text-red-600 hover:bg-red-100 rounded"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </div>
            </div>
          ))}
          {categorias.length === 0 && <p className="col-span-full text-center text-slate-400 italic py-10">Sin categorías.</p>}
        </div>
      </div>
    </div>
  );

  const renderModalEdit = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-widest">Editar {editType.toUpperCase()}</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-8 space-y-6">
                {(editType === 'marca' || editType === 'proveedor' || editType === 'cat' || editType === 'zona' || editType === 'cc' || editType === 'dep' || editType === 'puesto') && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Nombre / Título</label>
                        <input type="text" required value={editData.nombre || ''} onChange={e => setEditData({...editData, nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold" />
                    </div>
                )}

                {editType === 'cc' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Código Centro de Costo</label>
                        <input type="text" required value={editData.codigo || ''} onChange={e => setEditData({...editData, codigo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold font-mono" />
                    </div>
                )}

                {editType === 'marca' && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Descripción</label>
                        <textarea value={editData.descripcion || ''} onChange={e => setEditData({...editData, descripcion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold h-24" />
                    </div>
                )}

                {editType === 'proveedor' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">RFC</label>
                            <input type="text" value={editData.rfc || ''} onChange={e => setEditData({...editData, rfc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Email</label>
                            <input type="email" value={editData.contacto_email || ''} onChange={e => setEditData({...editData, contacto_email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold" />
                        </div>
                    </div>
                )}

                {editType === 'dep' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Zona / Sede</label>
                            <select value={editData.zona_id || ''} onChange={e => setEditData({...editData, zona_id: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold">
                                {zonas.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Centro de Costo</label>
                            <select value={editData.centro_costo_id || ''} onChange={e => setEditData({...editData, centro_costo_id: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold">
                                {centrosCosto.map(cc => <option key={cc.id} value={cc.id}>{cc.codigo} - {cc.nombre}</option>)}
                            </select>
                        </div>
                    </div>
                )}

                {editType === 'sla' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Horas de Resolución</label>
                            <input type="number" required value={editData.horas || ''} onChange={e => setEditData({...editData, horas: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Descripción de Servicio</label>
                            <textarea value={editData.descripcion || ''} onChange={e => setEditData({...editData, descripcion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold h-24" />
                        </div>
                    </>
                )}

                <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] transition-all">
                    Guardar Cambios
                </button>
            </form>
        </div>
    </div>
  );

  const handleUpdateSMTP = async (e) => {
    e.preventDefault();
    try {
      await clienteAxios.put('/config/smtp', smtpConfig);
      alert("Configuración SMTP guardada.");
    } catch (error) {
      alert("Error al guardar configuración SMTP.");
    }
  };

  const renderSMTP = () => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 animate-fadeIn max-w-2xl">
      <h3 className="text-sm font-bold text-slate-800 mb-2">Servidor de Correo Saliente (SMTP)</h3>
      <p className="text-xs text-slate-500 mb-6">Esta configuración se utiliza para enviar notificaciones y recuperación de contraseñas.</p>
      
      <form onSubmit={handleUpdateSMTP} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Host SMTP</label>
            <input type="text" value={smtpConfig.smtp_host} onChange={e => setSmtpConfig({...smtpConfig, smtp_host: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Puerto</label>
            <input type="number" value={smtpConfig.smtp_port} onChange={e => setSmtpConfig({...smtpConfig, smtp_port: parseInt(e.target.value)})} className="w-full border rounded px-3 py-2 text-sm" placeholder="587" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Usuario / Email</label>
            <input type="text" value={smtpConfig.smtp_user} onChange={e => setSmtpConfig({...smtpConfig, smtp_user: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Contraseña</label>
            <input type="password" value={smtpConfig.smtp_password} onChange={e => setSmtpConfig({...smtpConfig, smtp_password: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="••••••••" />
          </div>
        </div>
        <hr className="border-slate-100" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre Remitente</label>
            <input type="text" value={smtpConfig.emails_from_name} onChange={e => setSmtpConfig({...smtpConfig, emails_from_name: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="GNN Service Desk" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Email Remitente</label>
            <input type="email" value={smtpConfig.emails_from_email} onChange={e => setSmtpConfig({...smtpConfig, emails_from_email: e.target.value})} className="w-full border rounded px-3 py-2 text-sm" placeholder="no-reply@empresa.com" />
          </div>
        </div>
        <div className="flex items-center gap-2 py-2">
           <input type="checkbox" id="tls" checked={smtpConfig.smtp_tls} onChange={e => setSmtpConfig({...smtpConfig, smtp_tls: e.target.checked})} className="rounded text-blue-600" />
           <label htmlFor="tls" className="text-xs font-bold text-slate-600">Usar TLS (Recomendado)</label>
        </div>

        <hr className="border-slate-100" />
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preferencias de Notificación</h4>
        <div className="flex gap-2">
            <button type="button" onClick={() => setSmtpConfig({...smtpConfig, notificar_ticket_creado: true, notificar_ticket_reasignado: true, notificar_ticket_cerrado: true, notificar_activo_asignado: true})} className="text-[10px] font-bold text-blue-600 hover:underline">Activar Todas</button>
            <span className="text-slate-300">|</span>
            <button type="button" onClick={() => setSmtpConfig({...smtpConfig, notificar_ticket_creado: false, notificar_ticket_reasignado: false, notificar_ticket_cerrado: false, notificar_activo_asignado: false})} className="text-[10px] font-bold text-slate-500 hover:underline">Desactivar Todas</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 py-2">
          {[
            { id: 'notificar_ticket_creado', label: 'Ticket Creado (Usuario/Técnico)' },
            { id: 'notificar_ticket_reasignado', label: 'Ticket Reasignado (Usuario/Técnico)' },
            { id: 'notificar_ticket_cerrado', label: 'Ticket Cerrado (Usuario/Técnico)' },
            { id: 'notificar_activo_asignado', label: 'Cambio de Activo (Alta/Baja)' }
          ].map(pref => (
            <div key={pref.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
               <span className="text-xs font-bold text-slate-700">{pref.label}</span>
               <input 
                  type="checkbox" 
                  checked={smtpConfig[pref.id]} 
                  onChange={e => setSmtpConfig({...smtpConfig, [pref.id]: e.target.checked})} 
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
               />
            </div>
          ))}
        </div>

        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded text-xs font-bold shadow hover:bg-blue-700 transition flex items-center gap-2">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
           Guardar Configuración
        </button>
      </form>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Configuración del Sistema</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Gestión de parámetros globales y catálogos maestros.</p>
      </div>

      <div className="flex-none flex items-center border-b border-slate-200 mb-6 gap-8 overflow-x-auto">
        {[
          { id: 'sla', label: 'SLA' }, 
          { id: 'estructura', label: 'Estructura Org.' },
          { id: 'marcas', label: 'Marcas' }, 
          { id: 'proveedores', label: 'Proveedores' }, 
          { id: 'categorias', label: 'Categorías' }, 
          { id: 'smtp', label: 'Correo Saliente' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            {tab.label} {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar-light">
        {loading ? <div className="h-40 flex items-center justify-center text-slate-400">Cargando configuración...</div> : (
          <>
            {activeTab === 'sla' && renderSLAConfig()}
            {activeTab === 'estructura' && renderEstructura()}
            {activeTab === 'marcas' && renderMarcas()}
            {activeTab === 'proveedores' && renderProveedores()}
            {activeTab === 'categorias' && renderCategorias()}
            {activeTab === 'smtp' && renderSMTP()}
          </>
        )}
      </div>

      {showEditModal && renderModalEdit()}
    </div>
  );
};

export default Configuracion;