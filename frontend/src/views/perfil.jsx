import React from 'react';

const Perfil = ({ token, user, setUser }) => {
  return (
    <div className="space-y-6 text-slate-200 w-full animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Mi Perfil</h1>
        <p className="text-cyan-500 text-xs font-bold uppercase tracking-widest mt-1">Configuración de Cuenta</p>
      </header>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-8 max-w-2xl shadow-xl">
        <div className="flex items-center gap-6 mb-8 border-b border-slate-800 pb-8">
          <div className="w-24 h-24 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center font-black text-4xl text-cyan-500 shadow-inner">
             {user?.nombre?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white uppercase">{user?.nombre}</h2>
            <p className="text-slate-400 text-sm uppercase font-bold mt-1">{user?.rol} | {user?.departamento}</p>
          </div>
        </div>
        
        <div className="text-center p-6 bg-slate-950 rounded border border-slate-800">
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Opciones de cambio de contraseña e imagen próximamente...</p>
        </div>
      </div>
    </div>
  );
};

export default Perfil;