import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Lun', tickets: 4 }, { name: 'Mar', tickets: 7 },
  { name: 'Mie', tickets: 5 }, { name: 'Jue', tickets: 9 },
  { name: 'Vie', tickets: 3 }, { name: 'Sab', tickets: 2 },
];

const Dashboard = ({ user }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Estilo GNN */}
      <header className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-white">CENTRO DE CONTROL</h1>
          <p className="text-cyan-400 font-bold uppercase tracking-[0.3em] text-[9px] mt-2">
            Infraestructura TI • Gas Natural del Noroeste
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/20 text-[9px] font-black uppercase">Sesión Iniciada como</p>
          <p className="text-white font-black text-xs uppercase">{user?.nombre || 'Administrador'}</p>
        </div>
      </header>

      {/* Métricas Compactas y Elegantes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">💻</div>
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Activos Totales</p>
          <h3 className="text-5xl font-black mt-2 text-white tracking-tighter">124</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">🎫</div>
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Tickets Pendientes</p>
          <h3 className="text-5xl font-black mt-2 text-orange-400 tracking-tighter">08</h3>
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">⚡</div>
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Eficiencia SLA</p>
          <h3 className="text-5xl font-black mt-2 text-cyan-400 tracking-tighter">98%</h3>
        </div>
      </div>

      {/* Gráfica de Rendimiento (Mesa de Ayuda) */}
      <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10">
        <div className="flex justify-between items-center mb-10">
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Actividad Semanal de Soporte</h4>
          <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full font-bold uppercase">En Línea</span>
        </div>
        
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '15px', fontSize: '10px' }} 
                itemStyle={{ color: '#06b6d4' }}
              />
              <Area type="monotone" dataKey="tickets" stroke="#06b6d4" strokeWidth={4} fillOpacity={1} fill="url(#colorTickets)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;