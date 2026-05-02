import axios from 'axios';

/**
 * api.js — Axios instance for the Spring Boot backend.
 *
 * FIX: Base URL standardised to http://localhost:8080/api
 *   Works for both:
 *     - Create React App  (npm start  → localhost:3000)
 *     - Vite              (npm run dev → localhost:5173)
 *
 * Request interceptor:  attaches JWT Bearer token from localStorage.
 * Response interceptor: on 401, clears credentials and redirects to /login.
 */
const api = axios.create({
  baseURL: 'http://localhost:8080/api',   // ← single source of truth
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,                  // needed for CORS + credentials
  timeout: 15000,
});

// ── Request interceptor — attach JWT ─────────────────────────────────────────
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

// ── Response interceptor — handle auth errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
