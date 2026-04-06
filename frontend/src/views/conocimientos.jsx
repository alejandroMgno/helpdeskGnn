// frontend/src/views/conocimientos.jsx
import React, { useState } from 'react';

const Conocimiento = ({ user, token }) => {
  // MOCK DATA: Artículos
  // NOTA: El Artículo 1 ahora incluye la sintaxis ![alt](url) dentro de su contenido para mostrar una imagen inline.
  const [articulos, setArticulos] = useState([
    { id: 1, titulo: 'Guía de instalación para entorno de ClinicSync', categoria: 'Desarrollo', autor: 'Admin Sistema', fecha: '12 Mar 2026', vistas: 145, imagenUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', contenido: 'Para configurar el entorno de desarrollo de ClinicSync localmente, asegúrate de tener instaladas las últimas dependencias de Node.js y Python.\n\n![Terminal de Node](https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80)\n\nClona el repositorio, ejecuta npm install en la carpeta del frontend y pip install -r requirements.txt en el backend. Las variables de entorno de base de datos se encuentran en el gestor de contraseñas corporativo.' },
    { id: 2, titulo: 'Cómo solicitar vacaciones o ausencias', categoria: 'Políticas', autor: 'Recursos Humanos', fecha: '05 Ene 2026', vistas: 432, imagenUrl: '', contenido: 'Toda solicitud de vacaciones debe realizarse a través del portal de RRHH al menos 15 días antes de la fecha deseada. El sistema validará automáticamente si tienes días disponibles. Una vez aprobado por tu jefe directo, el estatus cambiará a "Aprobado".' },
    { id: 3, titulo: 'Configuración de respaldos en la nube para Rubio Films', categoria: 'Infraestructura', autor: 'Roberto Torres', fecha: '28 Feb 2026', vistas: 89, imagenUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', contenido: 'El material de fotografía y videografía es crítico. Todos los archivos RAW y proyectos en bruto deben sincronizarse diariamente usando el cliente de Google Cloud Platform (GCP). Asegúrate de que la carpeta de exportación esté apuntando al bucket "rf-media-backup-2026". Si el cliente de GCP muestra error de autenticación, levanta un ticket.' },
    { id: 4, titulo: 'Solución a error de VPN (Error 809)', categoria: 'Redes', autor: 'Ana Gómez', fecha: '14 Feb 2026', vistas: 310, imagenUrl: '', contenido: 'Si intentas conectar la VPN estando fuera de la oficina y recibes el Error 809, se debe a que el cortafuegos de tu red local está bloqueando los puertos L2TP/IPsec. Intenta cambiar tu conexión a los datos del celular (Hotspot) o reinicia el módem de tu casa. Si persiste, el equipo de TI puede reconfigurar tu adaptador de red.' },
    { id: 5, titulo: 'Mantenimiento preventivo de equipo audiovisual', categoria: 'Hardware', autor: 'Admin Sistema', fecha: '10 Abr 2026', vistas: 56, imagenUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', contenido: 'Limpiar los lentes y sensores de las cámaras debe hacerse estrictamente en un ambiente libre de polvo usando los kits de limpieza autorizados. Evita usar aire comprimido directamente sobre el sensor. Las baterías deben calibrarse (descarga completa y carga al 100%) una vez al mes para prolongar su vida útil.' }
  ]);

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);

  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [formArticulo, setFormArticulo] = useState({
    id: null,
    titulo: '',
    categoria: 'Sistemas',
    imagenUrl: '',
    contenido: ''
  });

  const categoriasFiltro = ['Todas', ...new Set(articulos.map(a => a.categoria))];
  const categoriasOpciones = ['Desarrollo', 'Políticas', 'Infraestructura', 'Redes', 'Hardware', 'Sistemas', 'Otros'];

  const articulosFiltrados = articulos.filter(a => {
    const coincideCategoria = categoriaActiva === 'Todas' || a.categoria === categoriaActiva;
    const coincideBusqueda = a.titulo.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
      a.contenido.toLowerCase().includes(terminoBusqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  const getCategoriaColor = (categoria) => {
    const colors = {
      'Desarrollo': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      'Políticas': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      'Infraestructura': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      'Redes': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
      'Hardware': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    };
    return colors[categoria] || 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  };

  // --- MOTOR DE RENDERIZADO PARA IMÁGENES INLINE ---
  // Esta función busca patrones como ![texto alternativo](URL) y los convierte en etiquetas <img>
  const renderizarContenido = (texto) => {
    if (!texto) return null;

    // Expresión regular para markdown de imágenes: ![alt](url)
    const regex = /!\[([^\]]*)\]\((.*?)\)/g;
    const partes = [];
    let ultimoIndice = 0;
    let match;

    while ((match = regex.exec(texto)) !== null) {
      // Agregar el texto normal que está antes de la imagen
      if (match.index > ultimoIndice) {
        partes.push(texto.substring(ultimoIndice, match.index));
      }
      // Agregar la imagen renderizada
      partes.push(
        <div key={match.index} className="my-6 flex justify-center">
          <img
            src={match[2]}
            alt={match[1]}
            className="rounded-xl border border-slate-700 shadow-lg max-w-full h-auto object-cover max-h-[400px]"
          />
        </div>
      );
      ultimoIndice = regex.lastIndex;
    }

    // Agregar el texto restante después de la última imagen
    if (ultimoIndice < texto.length) {
      partes.push(texto.substring(ultimoIndice));
    }

    // Retornamos el array de partes procesando los saltos de línea del texto
    return partes.map((parte, index) => {
      if (typeof parte === 'string') {
        return <span key={index} className="whitespace-pre-wrap leading-relaxed">{parte}</span>;
      }
      return parte;
    });
  };

  const abrirParaCrear = () => {
    setEsEdicion(false);
    setFormArticulo({ id: null, titulo: '', categoria: 'Sistemas', imagenUrl: '', contenido: '' });
    setMostrarModalForm(true);
  };

  const abrirParaEditar = () => {
    setEsEdicion(true);
    setFormArticulo({ ...articuloSeleccionado });
    setMostrarModalForm(true);
  };

  const manejarGuardadoArticulo = (e) => {
    e.preventDefault();
    if (!formArticulo.titulo.trim() || !formArticulo.contenido.trim()) {
      alert("Por favor, llena el título y el contenido.");
      return;
    }

    if (esEdicion) {
      const articulosActualizados = articulos.map(art =>
        art.id === formArticulo.id ? { ...art, ...formArticulo } : art
      );
      setArticulos(articulosActualizados);
      setArticuloSeleccionado({ ...articuloSeleccionado, ...formArticulo });
    } else {
      const fechaActual = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const articuloCreado = {
        id: Date.now(),
        titulo: formArticulo.titulo,
        categoria: formArticulo.categoria,
        imagenUrl: formArticulo.imagenUrl,
        autor: user?.nombre_completo || 'Administrador',
        fecha: fechaActual,
        vistas: 0,
        contenido: formArticulo.contenido
      };
      setArticulos([articuloCreado, ...articulos]);
    }
    setMostrarModalForm(false);
  };

  return (
    <div className="relative h-full flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Base de Conocimientos</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            Encuentra soluciones rápidas, guías y políticas de la empresa.
          </p>
        </div>
        {['Admin', 'Tecnico'].includes(user?.rol) && (
          <div className="flex items-center gap-3">
            <button
              onClick={abrirParaCrear}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-900/50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Nuevo Artículo
            </button>
          </div>
        )}
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm mb-6">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            placeholder="¿Qué necesitas ayuda hoy? (Ej. Configurar correo, ERP, red...)"
            className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-xl pl-12 pr-4 py-4 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-500 placeholder:font-medium"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          {categoriasFiltro.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoriaActiva(cat)}
              className={`px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition whitespace-nowrap ${categoriaActiva === cat
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 shadow-sm'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRID DE ARTÍCULOS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {articulosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 rounded-xl border border-slate-800 border-dashed">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-lg font-bold text-slate-300">No encontramos ningún artículo</h3>
            <p className="text-slate-500 mt-1">Intenta con otras palabras clave o cambia la categoría.</p>
            <button
              onClick={() => { setTerminoBusqueda(''); setCategoriaActiva('Todas'); }}
              className="mt-4 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition border border-slate-700"
            >
              Limpiar Búsqueda
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {articulosFiltrados.map(articulo => (
              <div
                key={articulo.id}
                onClick={() => setArticuloSeleccionado(articulo)}
                className="bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all cursor-pointer group flex flex-col h-full overflow-hidden"
              >
                {articulo.imagenUrl && (
                  <div className="h-32 w-full bg-slate-800 overflow-hidden relative">
                    <img src={articulo.imagenUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded text-[9px] font-black tracking-widest uppercase border ${getCategoriaColor(articulo.categoria)}`}>
                      {articulo.categoria}
                    </span>
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      {articulo.vistas}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                    {articulo.titulo}
                  </h3>

                  <p className="text-sm text-slate-400 mb-6 line-clamp-3 flex-1">
                    {/* Para el preview de la tarjeta, quitamos las urls de imagenes del texto */}
                    {articulo.contenido.replace(/!\[.*?\]\(.*?\)/g, '[Imagen Adjunta]')}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 text-[10px] font-bold">
                        {articulo.autor.charAt(0)}
                      </div>
                      <span className="text-xs font-bold text-slate-500">{articulo.autor}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">{articulo.fecha}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* MODAL / PANEL LATERAL DE CREAR Y EDITAR   */}
      {/* ========================================= */}
      {mostrarModalForm && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">

            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${esEdicion ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'}`}>
                  {esEdicion ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{esEdicion ? 'Editar Artículo' : 'Publicar Nuevo Artículo'}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base de Conocimientos</p>
                </div>
              </div>
              <button onClick={() => setMostrarModalForm(false)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <form id="form-articulo" onSubmit={manejarGuardadoArticulo} className="space-y-6">

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Título del Artículo *</label>
                  <input
                    type="text"
                    required
                    value={formArticulo.titulo}
                    onChange={(e) => setFormArticulo({ ...formArticulo, titulo: e.target.value })}
                    placeholder="Ej. Cómo configurar la impresora principal..."
                    className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Categoría *</label>
                    <select
                      value={formArticulo.categoria}
                      onChange={(e) => setFormArticulo({ ...formArticulo, categoria: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors cursor-pointer appearance-none"
                    >
                      {categoriasOpciones.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex justify-between">
                      <span>Imagen Principal (Portada)</span>
                      <span className="text-slate-600 font-medium normal-case">Opcional</span>
                    </label>
                    <input
                      type="url"
                      value={formArticulo.imagenUrl}
                      onChange={(e) => setFormArticulo({ ...formArticulo, imagenUrl: e.target.value })}
                      placeholder="https://ejemplo.com/img.jpg"
                      className="w-full bg-slate-950 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                {/* INSTRUCCIÓN PARA IMÁGENES INLINE */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between items-end">
                    <span>Contenido Principal *</span>
                    <span className="text-cyan-600 font-medium normal-case text-[10px] bg-cyan-900/30 px-2 py-1 rounded">
                      Usa <code className="text-cyan-400 bg-slate-900 px-1 rounded">![alt](url_imagen)</code> para insertar imágenes en el texto
                    </span>
                  </label>
                  <textarea
                    required
                    value={formArticulo.contenido}
                    onChange={(e) => setFormArticulo({ ...formArticulo, contenido: e.target.value })}
                    placeholder={`Escribe la solución detallada aquí.\n\nPara poner una imagen de referencia usa este formato:\n\n![Referencia Visual](https://ejemplo.com/mifoto.jpg)`}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-300 text-sm rounded-xl px-4 py-4 outline-none focus:border-cyan-500 transition-colors h-64 resize-none custom-scrollbar"
                  ></textarea>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end gap-3">
              <button
                onClick={() => setMostrarModalForm(false)}
                className="px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                form="form-articulo"
                type="submit"
                className={`${esEdicion ? 'bg-yellow-600 hover:bg-yellow-500 shadow-yellow-900/50' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/50'} text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2`}
              >
                {esEdicion ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    Guardar Cambios
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Publicar Ahora
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* DRAWER / PANEL LATERAL DE LECTURA */}
      {/* ========================================= */}
      {articuloSeleccionado && !mostrarModalForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full md:w-[700px] bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col animate-slide-in-right h-full">

            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20 text-cyan-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modo Lectura</span>
              </div>
              <div className="flex items-center gap-2">
                {['Admin', 'Tecnico'].includes(user?.rol) && (
                  <button
                    onClick={abrirParaEditar}
                    className="text-slate-400 hover:text-yellow-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded transition font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Editar
                  </button>
                )}
                <button onClick={() => setArticuloSeleccionado(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition ml-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/30 relative">

              {articuloSeleccionado.imagenUrl && (
                <div className="w-full h-64 bg-slate-900 border-b border-slate-800 relative">
                  <img
                    src={articuloSeleccionado.imagenUrl}
                    alt="Portada del artículo"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
                </div>
              )}

              <div className={`p-8 ${articuloSeleccionado.imagenUrl ? '-mt-24 relative z-10' : ''}`}>
                <span className={`px-2.5 py-1 rounded text-[10px] font-black tracking-widest uppercase border inline-block mb-4 bg-slate-900/80 backdrop-blur-sm ${getCategoriaColor(articuloSeleccionado.categoria)}`}>
                  {articuloSeleccionado.categoria}
                </span>

                <h1 className="text-3xl font-black text-white leading-tight mb-6 drop-shadow-md">
                  {articuloSeleccionado.titulo}
                </h1>

                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700 shadow-lg">
                      {articuloSeleccionado.autor.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{articuloSeleccionado.autor}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">{articuloSeleccionado.fecha}</p>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-slate-500 text-xs font-bold bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded border border-slate-800 shadow-lg">
                    <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                    {articuloSeleccionado.vistas} Vistas
                  </div>
                </div>

                <div className="text-slate-300 text-lg">
                  {/* AQUÍ LLAMAMOS A LA FUNCIÓN QUE RENDERIZA LAS IMÁGENES INLINE */}
                  {renderizarContenido(articuloSeleccionado.contenido)}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col items-center justify-center text-center">
                  <h4 className="text-sm font-bold text-slate-400 mb-4">¿Te fue útil este artículo?</h4>
                  <div className="flex gap-4">
                    <button className="bg-slate-900 hover:bg-green-500/10 border border-slate-700 hover:border-green-500/50 text-slate-300 hover:text-green-400 px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                      Sí, me sirvió
                    </button>
                    <button className="bg-slate-900 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-300 hover:text-red-400 px-6 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"></path></svg>
                      No me sirvió
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
};

export default Conocimiento;