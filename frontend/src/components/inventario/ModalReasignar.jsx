import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const ModalReasignar = ({ isOpen, onClose, form, setForm, onSubmit, usuarios, activo }) => {
  if (!isOpen) return null;
  const sigCanvas = useRef({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sigCanvas.current.isEmpty()) {
        alert("Por favor, firme el documento para continuar.");
        return;
    }
    const firma = sigCanvas.current.toDataURL();
    onSubmit(e, firma);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="p-6 border-b flex justify-between bg-slate-50">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Cambiar Asignación</h3>
                <button onClick={onClose}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Nuevo Responsable</label>
                    <select required value={form.nuevo_asignado_id} onChange={e => setForm({...form, nuevo_asignado_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500">
                        <option value="">-- Seleccionar Usuario --</option>
                        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre_completo}</option>)}
                    </select>
                </div>

                {/* LICENCIAS VINCULADAS */}
                {activo.licencias?.length > 0 && (
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Licencias a conservar</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar-light">
                        {activo.licencias.map(lic => (
                            <div key={lic.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        checked={form.licencias_ids.includes(lic.id)}
                                        onChange={(e) => {
                                            const ids = e.target.checked 
                                                ? [...form.licencias_ids, lic.id]
                                                : form.licencias_ids.filter(id => id !== lic.id);
                                            setForm({...form, licencias_ids: ids});
                                        }}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-slate-700">{lic.nombre}</span>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{lic.tipo}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[9px] text-slate-400 italic">* Las licencias no seleccionadas serán liberadas automáticamente.</p>
                </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Notas de entrega</label>
                    <input type="text" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner" />
                </div>
                
                {/* FIRMA */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Firma de Conformidad</label>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                        <SignatureCanvas ref={sigCanvas} penColor='blue' canvasProps={{width: 400, height: 150, className: 'signatureCanvas'}} />
                    </div>
                    <button type="button" onClick={() => sigCanvas.current.clear()} className="text-[10px] text-slate-500 hover:text-red-600 underline">Limpiar firma</button>
                </div>
                
                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Confirmar Reasignación
                </button>
            </form>
        </div>
    </div>
  );
};

export default ModalReasignar;
