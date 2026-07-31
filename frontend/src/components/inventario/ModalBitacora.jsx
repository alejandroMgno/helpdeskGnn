import React from 'react';

const ModalBitacora = ({ isOpen, onClose, form, setForm, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="p-6 border-b flex justify-between bg-slate-50 items-center">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Nueva Entrada de Bitácora</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Tipo de Servicio</label>
              <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all">
                <option value="Preventivo">Preventivo</option>
                <option value="Correctivo">Correctivo</option>
                <option value="Mejora">Mejora / Upgrade</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fecha de Ejecución</label>
              <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descripción Técnica</label>
            <textarea required placeholder="Tareas realizadas..." rows="3" value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all resize-none shadow-inner" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Inversión / Costo (MXN)</label>
            <input type="number" step="0.01" value={form.costo} onChange={e => setForm({...form, costo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all shadow-inner" />
          </div>
          
          <div className="pt-2">
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Guardar en Historial
            </button>
            <p className="text-center text-[9px] text-slate-400 font-bold uppercase mt-4 italic tracking-wider">Actualizará automáticamente la salud del activo</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalBitacora;
