import axios from 'axios';
import { clearAuthSession, getStoredAuthToken } from './authSession';

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  return '/api';
};


export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    // Si hay una respuesta exitosa, limpiar el flag de IP no autorizada
    // Esto permite que el diálogo se cierre si la IP fue autorizada
    if (sessionStorage.getItem('ip_not_allowed') === 'true') {
      sessionStorage.removeItem('ip_not_allowed');
      sessionStorage.removeItem('ip_error_message');
      // Disparar evento para cerrar el diálogo
      window.dispatchEvent(new CustomEvent('ip-allowed'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // Detectar error 403 de IP no autorizada
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || '';
      if (errorMessage.includes('IP no autorizada') || errorMessage.includes('Acceso denegado')) {
        // Almacenar el error de IP en sessionStorage para que el componente global lo detecte
        sessionStorage.setItem('ip_not_allowed', 'true');
        sessionStorage.setItem('ip_error_message', errorMessage);
        // Disparar evento personalizado para que los componentes lo escuchen
        window.dispatchEvent(new CustomEvent('ip-not-allowed', { detail: { message: errorMessage } }));
      }
    }
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;
