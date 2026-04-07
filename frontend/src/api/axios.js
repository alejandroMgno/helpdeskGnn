import axios from 'axios';

// Tu URL base del backend
const API_URL = 'http://localhost:8000/api/v1';

const clienteAxios = axios.create({
    baseURL: API_URL,
});

// Interceptor: Antes de que cualquier petición salga de React hacia FastAPI, 
// este código le pega el Token de seguridad (si existe).
clienteAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('zenit_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para errores: Si el backend dice "401 No Autorizado" (token vencido), 
// cerramos la sesión automáticamente.
clienteAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('zenit_token');
            window.location.href = '/'; // Recarga la página para ir al Login
        }
        return Promise.reject(error);
    }
);

export default clienteAxios;