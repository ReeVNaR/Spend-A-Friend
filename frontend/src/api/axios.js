import axios from 'axios';

// In production on Vercel, VITE_API_URL points to the Render backend (e.g. https://spend-a-friend.onrender.com/api).
// In local development, defaults to '/api' which Vite proxies to http://localhost:5000/api.
let baseURL = import.meta.env.VITE_API_URL || '/api';

if (typeof baseURL === 'string' && baseURL.endsWith('/') && baseURL.length > 1) {
  baseURL = baseURL.slice(0, -1);
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
