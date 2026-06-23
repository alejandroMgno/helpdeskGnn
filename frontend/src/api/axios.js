import axios from 'axios';

// Usamos variables de entorno para producción, si no existe, usamos localhost por defecto.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const clienteAxios = axios.create({
    baseURL: API_URL,
});

// Interceptor Request: Antes de que cualquier petición salga de React hacia FastAPI, 
// este código le pega el Token de seguridad (si existe).
clienteAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('gnn_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor Response: Si el backend dice "401 No Autorizado" (token vencido), 
// cerramos la sesión automáticamente.
clienteAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('gnn_token');
            window.location.href = '/'; // Recarga la página para ir al Login
        }
        return Promise.reject(error);
    }
);

export default clienteAxios;