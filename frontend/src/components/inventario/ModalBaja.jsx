import React from 'react';

const ModalBaja = ({ isOpen, onClose, form, setForm, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        <div className="p-6 border-b flex justify-between bg-slate-50 items-center">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Proceso de Baja de Activo</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
        </div>

        <form onSubmit={onSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Motivo de la Baja</label>
            <select value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-red-500 transition-all">
                <option value="Robo">Baja por Robo</option>
                <option value="Venta">Baja por Venta</option>
                <option value="Obsolescencia">Baja por Obsolescencia</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Notas Adicionales</label>
            <textarea placeholder="Detalles sobre la baja..." rows="2" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-red-500 transition-all resize-none shadow-inner" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {form.motivo === 'Robo' ? 'Denuncia (PDF) *' : form.motivo === 'Venta' ? 'Factura (PDF) *' : 'Dictamen / Otros (PDF)'}
            </label>
            <input 
                type="file" 
                accept=".pdf" 
                multiple
                onChange={(e) => setForm({...form, archivos: Array.from(e.target.files)})}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
          </div>
          
          <div className="pt-2">
            <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Confirmar Baja del Activo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalBaja;
