// frontend/src/api/axios.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"  // Important for ngrok
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
    
    // Log request for debugging
    console.log('🚀 Request:', config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with CORS debugging
api.interceptors.response.use(
  (response) => {
    // Log CORS headers for debugging
    console.log('✅ Response CORS Headers:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-credentials': response.headers['access-control-allow-credentials']
    });
    
    return response;
  },
  (error) => {
    // Better CORS error logging
    if (error.message?.includes('CORS')) {
      console.error('❌ CORS Error:', error.message);
      console.error('Request URL:', error.config?.url);
      console.error('Request Origin:', window.location.origin);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;