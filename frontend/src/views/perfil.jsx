import React, { useState } from 'react';
import clienteAxios from '../api/axios';

const Perfil = ({ token, user, setUser }) => {
  // Estados para el formulario de contraseña
  const [formPasswords, setFormPasswords] = useState({
    actual: '',
    nueva: '',
    confirmacion: ''
  });

  // Estados para la carga e imagen
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  
  // Función auxiliar para obtener la URL completa del avatar
  const getFullAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = clienteAxios.defaults.baseURL.replace(/\/api\/v1$/, '');
    return `${baseUrl}${url}`;
  };

  const [previewUrl, setPreviewUrl] = useState(getFullAvatarUrl(user?.avatar_url) || null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // 1. LÓGICA PARA CAMBIO DE CONTRASEÑA
  const handleCambioPassword = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });

    if (formPasswords.nueva !== formPasswords.confirmacion) {
      return setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' });
    }

    setCargando(true);
    try {
      const response = await clienteAxios.put('/usuarios/password', {
        password_actual: formPasswords.actual,
        password_nueva: formPasswords.nueva
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        setMensaje({ tipo: 'exito', texto: 'Contraseña actualizada correctamente.' });
        setFormPasswords({ actual: '', nueva: '', confirmacion: '' });
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al cambiar la contraseña.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error al cambiar la contraseña.' });
    } finally {
      setCargando(false);
    }
  };

// 2. LÓGICA PARA SELECCIÓN Y SUBIDA DE IMAGEN
  const handleSeleccionarImagen = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenSeleccionada(file);
      // Crear una URL temporal para mostrar la vista previa inmediatamente
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };

  const handleSubirImagen = async () => {
    if (!imagenSeleccionada) return;

    setCargando(true);
    setMensaje({ tipo: '', texto: '' });

    const formData = new FormData();
    formData.append('file', imagenSeleccionada);

    try {
      const response = await clienteAxios.post(`/usuarios/${user.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.status === 200) {
        setMensaje({ tipo: 'exito', texto: 'Imagen de perfil actualizada.' });
        
        // La URL que devuelve el backend es relativa, p. ej. "/uploads/avatars/..."
        // Necesitamos construir la URL absoluta para el frontend
        const baseUrl = clienteAxios.defaults.baseURL.replace(/\/api\/v1$/, '');
        const newAvatarUrl = `${baseUrl}${response.data.avatar_url}?t=${new Date().getTime()}`;
        
        if (setUser) {
          setUser({ ...user, avatar_url: newAvatarUrl });
        }
        setImagenSeleccionada(null); // Resetear tras subir
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al subir la imagen.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: error.response?.data?.detail || 'Error de conexión.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 font-sans animate-in fade-in duration-700">

      {/* HEADER */}
      <header className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Mi Perfil</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Gestión de cuenta, seguridad y preferencias.</p>
      </header>

      {/* MENSAJES DE ALERTA */}
      {mensaje.texto && (
        <div className={`p-3 rounded-lg mb-4 text-xs sm:text-sm font-semibold border ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* SECCIÓN 1: DATOS E IMAGEN */}
        <div className="p-5 sm:p-8 border-b border-slate-200 flex flex-col items-center sm:flex-row sm:items-start gap-6 bg-slate-50">

          <div className="relative group flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-3xl sm:text-4xl text-slate-400 shadow-sm overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.nombre_completo?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            {/* Botón flotante para subir imagen */}
            <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              <input type="file" accept="image/*" className="hidden" onChange={handleSeleccionarImagen} />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left w-full">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{user?.nombre_completo || 'Usuario'}</h2>
            <p className="text-blue-600 font-medium text-xs sm:text-sm mt-1 break-words">{user?.email}</p>
            
            {/* FICHA TÉCNICA RÁPIDA */}
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-4 text-[10px] sm:text-xs">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Empresa</span>
                <span className="text-slate-700 font-semibold truncate">{user?.empresa || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Nº Empleado</span>
                <span className="text-slate-700 font-semibold truncate">{user?.no_empleado || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Puesto</span>
                <span className="text-slate-700 font-semibold truncate">{user?.puesto || 'N/A'}</span>
              </div>
            </div>

            {/* Botón de guardar imagen */}
            {imagenSeleccionada && (
              <div className="mt-4">
                <button onClick={handleSubirImagen} disabled={cargando} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-semibold transition shadow-sm disabled:opacity-50">
                  {cargando ? 'Guardando...' : 'Guardar Nueva Foto'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: FORMULARIO DE CONTRASEÑA */}
        <div className="p-5 sm:p-8">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
            Cambiar Contraseña
          </h3>

          <form onSubmit={handleCambioPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña Actual</label>
              <input
                type="password"
                required
                value={formPasswords.actual}
                onChange={(e) => setFormPasswords({ ...formPasswords, actual: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
              <input
                type="password"
                required
                minLength="8"
                value={formPasswords.nueva}
                onChange={(e) => setFormPasswords({ ...formPasswords, nueva: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                minLength="8"
                value={formPasswords.confirmacion}
                onChange={(e) => setFormPasswords({ ...formPasswords, confirmacion: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-3 py-2 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-2.5 rounded-lg font-semibold text-sm transition shadow-sm"
            >
              {cargando ? 'Procesando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Perfil;
