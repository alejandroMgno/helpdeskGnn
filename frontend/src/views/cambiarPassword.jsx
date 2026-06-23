import React, { useState } from 'react';
import clienteAxios from '../api/axios';

const CambiarPassword = ({ setUser }) => {
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await clienteAxios.post('/auth/change-password', { new_password: password });
      // Actualizamos el usuario localmente para quitar la bandera
      setUser(prev => ({ ...prev, debe_cambiar_password: false }));
      alert("Contraseña actualizada con éxito");
    } catch (err) {
      setError(err.response?.data?.detail || "Error al cambiar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/src/assets/hero.png')", filter: 'brightness(0.35)' }}></div>
      
      <div className="relative z-10 w-full max-w-[400px] p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Nueva Contraseña</h1>
          <p className="text-slate-300 text-xs px-4">Por seguridad, debes establecer una contraseña definitiva antes de continuar.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest ml-1 mb-1 block">Contraseña Nueva</label>
            <input
              type="password" required placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-white text-xs outline-none focus:bg-white/10 transition-all"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest ml-1 mb-1 block">Confirmar Contraseña</label>
            <input
              type="password" required placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-white text-xs outline-none focus:bg-white/10 transition-all"
              onChange={(e) => setConfirmar(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-[10px] text-center font-bold uppercase">{error}</p>}

          <button disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-400 py-4 rounded-2xl font-black text-white text-[10px] tracking-widest transition-all shadow-lg shadow-cyan-500/20 active:scale-95 mt-4">
            {isLoading ? 'ACTUALIZANDO...' : 'ESTABLECER CONTRASEÑA'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CambiarPassword;