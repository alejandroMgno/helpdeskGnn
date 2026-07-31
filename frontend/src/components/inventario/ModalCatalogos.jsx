import React, { useState } from 'react';

const ModalCatalogos = ({ isOpen, onClose, tipo, setTipo, catalogoMarcas, catalogoProveedores, catalogoModelosParte, isAdmin, onDelete, onSubmit, form, setForm }) => {
  const [searchTerm, setSearchTerm] = useState('');
  if (!isOpen) return null;

  const getLabel = () => {
      switch(tipo) {
          case 'marca': return 'Marcas';
          case 'proveedor': return 'Proveedores';
          case 'modelo_parte': return 'Modelos por N° Parte';
          default: return '';
      }
  };

  const getItems = () => {
    let items = tipo === 'marca' ? catalogoMarcas : (tipo === 'proveedor' ? catalogoProveedores : catalogoModelosParte);
    if (!items) return [];
    
    return items.filter(item => 
        (item.nombre?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.numero_parte?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn flex max-h-[90vh]">
        {/* Sidebar */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 uppercase text-[10px] mb-4">Administrar</h3>
            <div className="space-y-1">
                {[
                {id: 'marca', label: 'Marcas', icon: 'pi-tag'},
                {id: 'proveedor', label: 'Proveedores', icon: 'pi-truck'},
                {id: 'modelo_parte', label: 'Modelos por N° Parte', icon: 'pi-database'}
                ].map(t => (
                    <button key={t.id} onClick={() => {setTipo(t.id); setSearchTerm('');}} className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-semibold transition-all ${tipo === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
                        <i className={`pi ${t.icon}`}></i> {t.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b flex justify-between items-center gap-4">
                <h4 className="font-bold text-slate-800 text-sm whitespace-nowrap">Gestión de {getLabel()}</h4>
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-[10px] outline-none focus:border-blue-500"
                />
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">✕</button>
            </div>
            
            {/* Formulario arriba */}
            {isAdmin && (
                <div className="p-3 bg-white border-b">
                    <form onSubmit={onSubmit} className="flex flex-col gap-2">
                        {tipo === 'modelo_parte' ? (
                        <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="space-y-0.5">
                                    <label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Tipo Dispositivo</label>
                                    <select value={form.tipo_dev || ''} onChange={e => setForm({...form, tipo_dev: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none focus:border-blue-500 font-semibold">
                                        <option value="">Seleccionar...</option>
                                        <option value="Equipo de Cómputo">Equipo de Cómputo</option>
                                        <option value="Celular">Celular</option>
                                        <option value="Monitor">Monitor</option>
                                        <option value="Impresora">Impresora</option>
                                        <option value="Servidor">Servidor</option>
                                        <option value="Tablet">Tablet</option>
                                    </select>
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">N° Parte</label>
                                    <input required placeholder="Ej: 20W0004XLM" value={form.numero_parte || ''} onChange={e => setForm({...form, numero_parte: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Nombre Comercial</label>
                                    <input required placeholder="Ej: ThinkPad L14 Gen 2" value={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            
                            {/* CAMPOS CONDICIONALES */}
                            <div className="grid grid-cols-4 gap-2">
                                {(form.tipo_dev === 'Equipo de Cómputo' || form.tipo_dev === 'Servidor' || form.tipo_dev === 'Tablet') && (
                                    <>
                                        <div className="space-y-0.5"><label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Procesador</label><input placeholder="i7-1165G7" value={form.cpu || ''} onChange={e => setForm({...form, cpu: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none" /></div>
                                        <div className="space-y-0.5"><label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">RAM</label><input placeholder="16GB" value={form.ram || ''} onChange={e => setForm({...form, ram: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none" /></div>
                                        <div className="space-y-0.5"><label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">SSD/HDD</label><input placeholder="512GB" value={form.almacenamiento || ''} onChange={e => setForm({...form, almacenamiento: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none" /></div>
                                        <div className="space-y-0.5"><label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">RMA/Soporte</label><input placeholder="Premier" value={form.rma || ''} onChange={e => setForm({...form, rma: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none" /></div>
                                    </>
                                )}
                                {form.tipo_dev === 'Celular' && (
                                    <>
                                        <div className="space-y-0.5"><label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">RAM</label><input placeholder="8GB" value={form.ram || ''} onChange={e => setForm({...form, ram: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none" /></div>
                                        <div className="space-y-0.5"><label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Almacenamiento</label><input placeholder="128GB" value={form.almacenamiento || ''} onChange={e => setForm({...form, almacenamiento: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none" /></div>
                                    </>
                                )}
                                {form.tipo_dev === 'Monitor' && (
                                    <div className="space-y-0.5"><label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Pulgadas</label><input placeholder="27''" value={form.pulgadas || ''} onChange={e => setForm({...form, pulgadas: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[9px] outline-none" /></div>
                                )}
                            </div>
                            
                            {/* ATRIBUTOS DINÁMICOS */}
                            <div className="bg-slate-50 border border-slate-200 p-1 rounded mt-1">
                                <p className="text-[9px] font-semibold text-slate-500 uppercase mb-0.5 ml-1">Campo Extra</p>
                                <div className="flex gap-1">
                                    <input id="key-attr" placeholder="Nombre campo" className="flex-1 bg-white border border-slate-200 p-1 rounded text-[9px] outline-none" />
                                    <input id="val-attr" placeholder="Valor" className="flex-1 bg-white border border-slate-200 p-1 rounded text-[9px] outline-none" />
                                    <button type="button" onClick={() => {
                                        const k = document.getElementById('key-attr').value;
                                        const v = document.getElementById('val-attr').value;
                                        if(!k || !v) return;
                                        setForm({...form, atributos: {...(form.atributos || {}), [k]: v}});
                                        document.getElementById('key-attr').value = '';
                                        document.getElementById('val-attr').value = '';
                                    }} className="bg-slate-800 text-white px-2 rounded text-[9px] font-bold">ADD</button>
                                </div>
                                {Object.keys(form.atributos || {}).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {Object.entries(form.atributos).map(([k, v]) => (
                                            <span key={k} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                                                {k}: {v}
                                                <button type="button" onClick={() => {
                                                    const newAttr = {...form.atributos};
                                                    delete newAttr[k];
                                                    setForm({...form, atributos: newAttr});
                                                }} className="text-blue-300 hover:text-blue-500">✕</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        ) : (
                        <div className="flex gap-2">
                            <div className="flex-1 space-y-0.5">
                                <label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Nombre</label>
                                <input required placeholder="Nombre" value={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[10px] outline-none focus:border-blue-500" />
                            </div>
                            {tipo === 'proveedor' && (
                                <div className="w-24 space-y-0.5">
                                    <label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">RFC</label>
                                    <input placeholder="RFC" value={form.rfc || ''} onChange={e => setForm({...form, rfc: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[10px] outline-none focus:border-blue-500" />
                                </div>
                            )}
                            <div className="flex-1 space-y-0.5">
                                <label className="text-[9px] font-semibold text-slate-500 uppercase ml-1">Descripción</label>
                                <input placeholder="Descripción" value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full bg-slate-50 border border-slate-200 p-1 rounded text-[10px] outline-none focus:border-blue-500" />
                            </div>
                        </div>
                        )}
                        <button className="w-full bg-blue-600 text-white py-1 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">
                        Guardar
                        </button>
                    </form>
                </div>
            )}
            
            {/* Lista abajo menos invasiva */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar-light bg-white">
                <div className="space-y-1">
                    {(() => {
                        const items = getItems();
                        if (!items || items.length === 0) return <p className="text-[10px] text-slate-400 text-center py-4">No hay elementos.</p>;
                        return items.map(item => (
                            <div key={item.id} className="flex justify-between items-center p-2 rounded hover:bg-slate-50 border-b border-slate-50 last:border-0 group">
                                <div className='min-w-0'>
                                    <p className="font-medium text-slate-700 text-[11px] truncate">{item.numero_parte ? `${item.numero_parte} - ${item.nombre}` : item.nombre}</p>
                                </div>
                                {isAdmin && (
                                    <button 
                                        onClick={() => onDelete(tipo, item.id)}
                                        className="text-slate-300 hover:text-red-500 p-1 transition-all"
                                    >
                                        <i className="pi pi-trash text-[9px]"></i>
                                    </button>
                                )}
                            </div>
                        ));
                    })()}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCatalogos;
