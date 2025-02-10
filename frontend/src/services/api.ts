import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token
        const token = localStorage.getItem('superAdminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Ensure we don't duplicate /api in the URL
        const url = config.url || '';
        if (!url.startsWith('/api/')) {
            config.url = `/api${url.startsWith('/') ? url : `/${url}`}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('superAdminToken');
            window.location.href = '/super-admin/login';
        }
        return Promise.reject(error);
    }
);

export default api;
