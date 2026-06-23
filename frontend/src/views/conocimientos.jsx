// frontend/src/views/conocimientos.jsx
import React, { useState, useEffect } from 'react';
import clienteAxios from '../api/axios';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const Conocimiento = ({ user }) => {
  const [articulos, setArticulos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);

  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [formArticulo, setFormArticulo] = useState({
    id: null, titulo: '', categoria: 'Sistemas', visibilidad: 'Externo', imagenUrl: '', contenido: ''
  });

  // 1. OBTENER ARTÍCULOS DESDE EL BACKEND
  const cargarArticulos = async () => {
    try {
      const res = await clienteAxios.get('/articulos/');
      setArticulos(res.data);
    } catch (error) {
      console.error("Error cargando artículos:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarArticulos();
  }, []);

  // Extraemos las categorías para los filtros
  const categoriasFiltro = ['Todas', ...new Set(articulos.map(a => a.categoria))];
  const categoriasOpciones = ['Desarrollo', 'Políticas', 'Infraestructura', 'Redes', 'Hardware', 'Sistemas', 'Otros'];

  const articulosFiltrados = articulos.filter(a => {
    const coincideCategoria = categoriaActiva === 'Todas' || a.categoria === categoriaActiva;
    const coincideBusqueda = a.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      a.contenido.toLowerCase().includes(terminoBusqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  // Colores corporativos (Light Theme) para Categorías
  const getCategoriaColor = (categoria) => {
    const colors = {
      'Desarrollo': 'text-purple-700 bg-purple-50 border-purple-200',
      'Políticas': 'text-emerald-700 bg-emerald-50 border-emerald-200',
      'Infraestructura': 'text-blue-700 bg-blue-50 border-blue-200',
      'Redes': 'text-orange-700 bg-orange-50 border-orange-200',
      'Hardware': 'text-amber-700 bg-amber-50 border-amber-200',
    };
    return colors[categoria] || 'text-indigo-700 bg-indigo-50 border-indigo-200';
  };

  const formatearFecha = (fechaString) => {
    return new Date(fechaString).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const renderizarContenido = (texto) => {
    if (!texto) return null;
    return (
      <div 
        className="ql-editor !p-0 text-slate-700 text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: texto }} 
      />
    );
  };

  // 2. ABRIR Y REGISTRAR VISTA
  const manejarAperturaArticulo = async (articulo) => {
    setArticuloSeleccionado(articulo);
    try {
      await clienteAxios.post(`/articulos/${articulo.id}/vistas`);
      setArticulos(articulos.map(a => a.id === articulo.id ? { ...a, vistas: a.vistas + 1 } : a));
      setArticuloSeleccionado(prev => ({ ...prev, vistas: prev.vistas + 1 }));
    } catch (error) {
      console.error("Error al registrar vista:", error);
    }
  };

  const abrirParaCrear = () => {
    setEsEdicion(false);
    setFormArticulo({ id: null, titulo: '', categoria: 'Sistemas', visibilidad: 'Externo', imagenUrl: '', contenido: '' });
    setMostrarModalForm(true);
  };

  const abrirParaEditar = () => {
    setEsEdicion(true);
    setFormArticulo({ ...articuloSeleccionado });
    setMostrarModalForm(true);
  };

  // 3. GUARDAR EN EL BACKEND
  const manejarGuardadoArticulo = async (e) => {
    e.preventDefault();
    if (!formArticulo.titulo.trim() || !formArticulo.contenido.trim()) {
      alert("Por favor, llena el título y el contenido.");
      return;
    }

    try {
      if (esEdicion) {
        const res = await clienteAxios.put(`/articulos/${formArticulo.id}`, formArticulo);
        setArticulos(articulos.map(art => art.id === formArticulo.id ? { ...art, ...res.data } : art));
        setArticuloSeleccionado({ ...articuloSeleccionado, ...res.data });
      } else {
        const res = await clienteAxios.post('/articulos/', formArticulo);
        setArticulos([res.data, ...articulos]);
      }
      setMostrarModalForm(false);
    } catch (error) {
      console.error("Error guardando el artículo:", error);
      alert("Hubo un error al guardar el artículo.");
    }
  };

  if (cargando) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Base de Conocimientos</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Encuentra soluciones rápidas, guías y políticas de la empresa.
          </p>
        </div>
        {['Admin', 'Tecnico'].includes(user?.rol) && (
          <div className="flex items-center gap-3">
            <button onClick={abrirParaCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm font-medium text-sm transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Nuevo Artículo
            </button>
          </div>
        )}
      </div>

      {/* BUSCADOR Y FILTROS (Caja Clara) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm mb-6">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            placeholder="¿En qué te podemos ayudar hoy? (Ej. Configurar correo, VPN...)"
            className="w-full bg-slate-50 border border-slate-300 text-slate-800 text-sm rounded-lg pl-12 pr-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar-light pb-2">
          {categoriasFiltro.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-1.5 rounded-full font-semibold text-xs transition whitespace-nowrap border ${categoriaActiva === cat
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE ARTÍCULOS (Tarjetas limpias estilo Planner) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-light pr-2 pb-6">
        {articulosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-lg font-semibold text-slate-700">No encontramos ningún artículo</h3>
            <p className="text-slate-500 mt-1 text-sm">Intenta con otras palabras clave o cambia la categoría.</p>
            <button onClick={() => { setTerminoBusqueda(''); setCategoriaActiva('Todas'); }} className="mt-4 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-sm font-medium transition border border-slate-300 shadow-sm">
              Limpiar Búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {articulosFiltrados.map(articulo => (
              <div
                key={articulo.id}
                onClick={() => manejarAperturaArticulo(articulo)}
                className="bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full overflow-hidden relative"
              >
                {articulo.imagenUrl && (
                  <div className="h-32 w-full bg-slate-100 overflow-hidden relative border-b border-slate-100">
                    <img src={articulo.imagenUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoriaColor(articulo.categoria)}`}>
                        {articulo.categoria}
                      </span>
                      {['Admin', 'Tecnico'].includes(user?.rol) && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${articulo.visibilidad === 'Interno' ? 'text-red-700 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}>
                          {articulo.visibilidad === 'Interno' ? (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                          ) : (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                          )}
                          {articulo.visibilidad}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {articulo.titulo}
                  </h3>

                  <p className="text-sm text-slate-600 mb-5 line-clamp-3 flex-1 leading-relaxed">
                    {articulo.contenido.replace(/!\[.*?\]\(.*?\)/g, '[Imagen Adjunta]')}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                        {articulo.autor?.nombre_completo?.charAt(0) || 'A'}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[100px]">{articulo.autor?.nombre_completo}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium" title="Vistas">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        {articulo.vistas}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{formatearFecha(articulo.fecha_creacion)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* MODAL CREAR / EDITAR (Modo Claro)           */}
      {/* ========================================= */}
      {mostrarModalForm && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[650px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-in-right h-full">

            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded border ${esEdicion ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                  {esEdicion ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{esEdicion ? 'Editar Artículo' : 'Publicar Nuevo Artículo'}</h2>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Base de Conocimientos</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalForm(false)} className="text-slate-400 hover:text-slate-600 bg-transparent hover:bg-slate-200 p-2 rounded transition border border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-light">
              <form id="form-articulo" onSubmit={manejarGuardadoArticulo} className="space-y-6">

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Título del Artículo <span className="text-red-500">*</span></label>
                  <input
                    type="text" required value={formArticulo.titulo}
                    onChange={(e) => setFormArticulo({ ...formArticulo, titulo: e.target.value })}
                    placeholder="Ej. Cómo configurar la impresora principal..."
                    className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Categoría <span className="text-red-500">*</span></label>
                    <select
                      value={formArticulo.categoria} onChange={(e) => setFormArticulo({ ...formArticulo, categoria: e.target.value })}
                      className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded px-3 py-2.5 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                      {categoriasOpciones.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block flex items-center gap-1">Privacidad <span className="text-red-500">*</span></label>
                    <select
                      value={formArticulo.visibilidad} onChange={(e) => setFormArticulo({ ...formArticulo, visibilidad: e.target.value })}
                      className={`w-full bg-white border text-sm rounded px-3 py-2.5 outline-none focus:ring-1 appearance-none cursor-pointer ${formArticulo.visibilidad === 'Interno'
                        ? 'border-red-300 text-red-700 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-blue-500'
                        }`}
                    >
                      <option value="Externo">🌐 Público (Todos)</option>
                      <option value="Interno">🔒 Interno (Staff)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 flex justify-between">
                    <span>Imagen Principal (Portada)</span>
                    <span className="text-slate-400 font-medium normal-case">Opcional</span>
                  </label>
                  <input
                    type="url" value={formArticulo.imagenUrl || ''}
                    onChange={(e) => setFormArticulo({ ...formArticulo, imagenUrl: e.target.value })}
                    placeholder="https://ejemplo.com/img.jpg"
                    className="w-full bg-white border border-slate-300 text-slate-800 text-sm rounded px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-3 flex justify-between items-end">
                    <span>Contenido Principal <span className="text-red-500">*</span></span>
                    <span className="text-blue-700 font-medium text-[10px] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                      Editor Enriquecido
                    </span>
                  </label>
                  <div className="bg-white">
                    <ReactQuill 
                      theme="snow"
                      value={formArticulo.contenido}
                      onChange={(val) => setFormArticulo({ ...formArticulo, contenido: val })}
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'image'],
                          ['clean']
                        ],
                      }}
                      className="h-64 mb-12"
                    />
                  </div>
                </div>

              </form>
            </div>

            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setMostrarModalForm(false)} className="px-5 py-2 rounded text-sm font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 transition">
                Cancelar
              </button>
              <button form="form-articulo" type="submit" className={`${esEdicion ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-5 py-2 rounded text-sm font-medium transition shadow flex items-center gap-2`}>
                {esEdicion ? 'Guardar Cambios' : 'Publicar Ahora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* DRAWER / PANEL LATERAL DE LECTURA (Claro)   */}
      {/* ========================================= */}
      {articuloSeleccionado && !mostrarModalForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[750px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-slide-in-right h-full">

            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 z-10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 border border-blue-200 rounded text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Modo Lectura</span>
                {['Admin', 'Tecnico'].includes(user?.rol) && articuloSeleccionado.visibilidad === 'Interno' && (
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border text-red-700 bg-red-50 border-red-200 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    Nota Interna
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {['Admin', 'Tecnico'].includes(user?.rol) && (
                  <button onClick={abrirParaEditar} className="text-slate-600 hover:text-amber-600 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded transition font-semibold text-xs flex items-center gap-1.5 shadow-sm">
                    Editar Artículo
                  </button>
                )}
                <button onClick={() => setArticuloSeleccionado(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded transition ml-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar-light bg-white relative">

              {articuloSeleccionado.imagenUrl && (
                <div className="w-full h-64 bg-slate-100 border-b border-slate-200 relative">
                  <img src={articuloSeleccionado.imagenUrl} alt="Portada" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
                </div>
              )}

              <div className={`px-8 md:px-12 pb-12 ${articuloSeleccionado.imagenUrl ? '-mt-16 relative z-10' : 'pt-8'}`}>
                <span className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border inline-block mb-4 bg-white ${getCategoriaColor(articuloSeleccionado.categoria)}`}>
                  {articuloSeleccionado.categoria}
                </span>

                <h1 className="text-3xl font-black text-slate-800 leading-tight mb-6">
                  {articuloSeleccionado.titulo}
                </h1>

                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 shadow-sm">
                      {articuloSeleccionado.autor?.nombre_completo?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{articuloSeleccionado.autor?.nombre_completo}</p>
                      <p className="text-[11px] font-medium text-slate-500">{formatearFecha(articuloSeleccionado.fecha_creacion)}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-slate-600 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    {articuloSeleccionado.vistas} Vistas
                  </div>
                </div>

                <div className="text-slate-700 text-base leading-relaxed">
                  {renderizarContenido(articuloSeleccionado.contenido)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } } .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }` }} />
    </div>
  );
};

export default Conocimiento;