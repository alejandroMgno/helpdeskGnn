import React from 'react';

const Conocimiento = ({ token, user }) => {
  return (
    <div className="space-y-6 text-slate-200 w-full animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Base de Conocimientos</h1>
          <p className="text-cyan-500 text-xs font-bold uppercase tracking-widest mt-1">Manuales y Soluciones GNN</p>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="🔍 Buscar artículo..." 
            className="bg-slate-900 border border-slate-700 px-4 py-2.5 rounded text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500 w-64 transition-colors"
          />
        </div>
      </header>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-10 text-center shadow-xl">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Módulo en construcción...</p>
        <p className="text-slate-600 text-xs mt-2">Aquí se listarán los manuales y guías de usuario.</p>
      </div>
    </div>
  );
};

export default Conocimiento;