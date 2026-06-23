import React, { useState } from 'react';

const Perfil = ({ token, user, setUser }) => {
  // Estados para el formulario de contraseña
  const [formPasswords, setFormPasswords] = useState({
    actual: '',
    nueva: '',
    confirmacion: ''
  });

  // Estados para la carga e imagen
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar_url || null);
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
      // Ajusta esta URL a tu endpoint real
      const response = await fetch('http://localhost:8000/api/v1/usuarios/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password_actual: formPasswords.actual,
          password_nueva: formPasswords.nueva
        })
      });

      if (response.ok) {
        setMensaje({ tipo: 'exito', texto: 'Contraseña actualizada correctamente.' });
        setFormPasswords({ actual: '', nueva: '', confirmacion: '' });
      } else {
        const errorData = await response.json();
        setMensaje({ tipo: 'error', texto: errorData.detail || 'Error al cambiar la contraseña.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión con el servidor.' });
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
      // Ajusta esta URL a tu endpoint real de subida de avatares
      const response = await fetch('http://localhost:8000/api/v1/usuarios/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setMensaje({ tipo: 'exito', texto: 'Imagen de perfil actualizada.' });
        // Actualizar el contexto del usuario global si la API devuelve la nueva URL
        if (data.avatar_url && setUser) {
          setUser({ ...user, avatar_url: data.avatar_url });
        }
        setImagenSeleccionada(null); // Resetear tras subir
      } else {
        setMensaje({ tipo: 'error', texto: 'Error al subir la imagen.' });
      }
    } catch (error) {
      setMensaje({ tipo: 'error', texto: 'Error de conexión.' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="w-full max-w-3xl font-sans animate-in fade-in duration-700">

      {/* HEADER CLARO */}
      <header className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Gestión de cuenta, seguridad y preferencias.</p>
      </header>

      {/* MENSAJES DE ALERTA */}
      {mensaje.texto && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {mensaje.texto}
        </div>
      )}

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

        {/* SECCIÓN 1: DATOS E IMAGEN */}
        <div className="p-8 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-8 bg-slate-50">

          <div className="relative group flex-shrink-0">
            <div className="w-28 h-28 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-4xl text-slate-400 shadow-sm overflow-hidden">
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

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-800">{user?.nombre_completo || 'Usuario'}</h2>
            <p className="text-blue-600 font-medium text-sm mt-1">{user?.email}</p>
            
            {/* FICHA TÉCNICA RÁPIDA */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-4 text-xs">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Empresa</span>
                <span className="text-slate-700 font-semibold">{user?.empresa || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Nº Empleado</span>
                <span className="text-slate-700 font-semibold">{user?.no_empleado || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Puesto</span>
                <span className="text-slate-700 font-semibold">{user?.puesto || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Departamento</span>
                <span className="text-slate-700 font-semibold">{user?.departamento || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">Centro de Costo</span>
                <span className="text-slate-700 font-semibold">{user?.centro_costo || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold uppercase tracking-wider">RFC / CURP</span>
                <span className="text-slate-700 font-semibold">{user?.rfc || 'N/A'} / {user?.curp || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">{user?.rol || 'Rol'}</span>
            </div>

            {/* Botón de guardar imagen (solo aparece si seleccionas una nueva) */}
            {imagenSeleccionada && (
              <div className="mt-4">
                <button onClick={handleSubirImagen} disabled={cargando} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded text-sm font-semibold transition shadow-sm disabled:opacity-50">
                  {cargando ? 'Guardando...' : 'Guardar Nueva Foto'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: FORMULARIO DE CONTRASEÑA */}
        <div className="p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z"></path></svg>
            Cambiar Contraseña
          </h3>

          <form onSubmit={handleCambioPassword} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña Actual</label>
              <input
                type="password"
                required
                value={formPasswords.actual}
                onChange={(e) => setFormPasswords({ ...formPasswords, actual: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nueva Contraseña</label>
              <input
                type="password"
                required
                minLength="8"
                value={formPasswords.nueva}
                onChange={(e) => setFormPasswords({ ...formPasswords, nueva: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                minLength="8"
                value={formPasswords.confirmacion}
                onChange={(e) => setFormPasswords({ ...formPasswords, confirmacion: e.target.value })}
                className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={cargando}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition shadow-sm w-full sm:w-auto"
              >
                {cargando ? 'Procesando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Perfil;