import React, { useState } from 'react';
import clienteAxios from '../api/axios'; // Importamos nuestro puente

const Login = ({ setToken }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // FastAPI exige los datos en formato URL Encoded
    const formData = new URLSearchParams();
    formData.append('username', loginData.email);
    formData.append('password', loginData.password);

    try {
      // Hacemos la petición POST al backend
      const res = await clienteAxios.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // Si es exitoso, guardamos el token
      const token = res.data.access_token;
      localStorage.setItem('gnn_token', token);
      setToken(token);

    } catch (err) {
      // Leemos dinámicamente el mensaje de error que configuramos en Python
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Error de comunicación con el servidor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Ingrese su correo corporativo para recibir una contraseña temporal:");
    if (!email) return;

    try {
      setIsLoading(true);
      await clienteAxios.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`);
      alert("Se ha enviado una contraseña temporal a su correo.");
    } catch (err) {
      alert(err.response?.data?.detail || "Error al solicitar recuperación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 bg-slate-950">
      {/* Fondo de pantalla */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/src/assets/hero.png')", filter: 'brightness(0.35)' }}></div>

      {/* Tarjeta de Login */}
      <div className="relative z-10 w-full max-w-[340px] p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-black tracking-tighter text-white">GNN</h1>
          <p className="text-cyan-400 font-bold uppercase tracking-[0.25em] text-[8px] opacity-80">Gas Natural del Noroeste</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email" required placeholder="Correo Corporativo"
            className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-white text-xs outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          />

          <input
            type="password" required placeholder="Contraseña"
            className="w-full bg-white/5 border border-white/10 p-3.5 rounded-2xl text-white text-xs outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          />

          {error && <p className="text-red-400 text-[10px] text-center font-bold uppercase">{error}</p>}

          <button disabled={isLoading} className="w-full bg-cyan-500 hover:bg-cyan-400 py-4 rounded-2xl font-black text-white text-[10px] tracking-widest transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
            {isLoading ? 'VERIFICANDO...' : 'INGRESAR'}
          </button>
        </form>

        <div className="mt-6 text-center">
           <button onClick={handleForgotPassword} className="text-white/40 hover:text-white text-[9px] font-bold uppercase tracking-wider transition-colors">
             ¿Olvidaste tu contraseña?
           </button>
        </div>

      </div>
    </div>
  );
};

export default Login;