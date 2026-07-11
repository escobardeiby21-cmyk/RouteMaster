import axios from 'axios';

const api = axios.create({
  // Si estamos desarrollando en la PC usa localhost, si estamos en Vercel usa Render
  baseURL: import.meta.env.DEV ? 'http://localhost:8000' : 'https://routemaster-1rmz.onrender.com',
});

// Interceptor para añadir el token automáticamente a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
