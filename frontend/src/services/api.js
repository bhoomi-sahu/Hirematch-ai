import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';

// Create configured Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (prepared for JWT token injection)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jobmatch_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error response handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message,
    });

    return Promise.reject(error);
  }
);

export default api;
