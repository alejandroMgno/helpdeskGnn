import React, { useState } from 'react';

const API_URL = 'http://localhost:8000/api/v1';

const Login = ({ setToken }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new URLSearchParams();
    formData.append('username', loginData.email);
    formData.append('password', loginData.password);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('zenit_token', data.access_token);
        setToken(data.access_token);
      } else {
        setError("Credenciales incorrectas");
      }
    } catch (err) {
      setError("Error de comunicación con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 bg-slate-950">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/src/assets/hero.png')", filter: 'brightness(0.35)' }}></div>
      <div className="relative z-10 w-full max-w-[340px] p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter text-white">ZEN-IT</h1>
          <p className="text-cyan-400 font-bold uppercase tracking-[0.25em] text-[8px] opacity-80">Gas Natural del Noroeste</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-5">
          <input 
            type="email" required placeholder="Correo Corporativo"
            className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-white text-xs outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
          />
          <input 
            type="password" required placeholder="Contraseña"
            className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-white text-xs outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
          />
          {error && <p className="text-red-400 text-[10px] text-center font-bold uppercase">{error}</p>}
          <button disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-400 py-4 rounded-2xl font-black text-white text-[10px] tracking-widest transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
            {isLoading ? 'VERIFICANDO...' : 'INGRESAR'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;