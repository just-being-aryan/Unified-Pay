// frontend/src/api/axios.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"  
  },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(' Request:', config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {

    console.log('Response CORS Headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials']
    });
    
    return response;
  },
  (error) => {
    
    if (error.message?.includes('CORS')) {
      console.error(' CORS Error:', error.message);
      console.error('Request URL:', error.config?.url);
      console.error('Request Origin:', window.location.origin);
    }
    
    if (error.response?.status === 401) {
    console.warn("401 received, token may be invalid");
    }
    
    return Promise.reject(error);
  }
);

export default api;