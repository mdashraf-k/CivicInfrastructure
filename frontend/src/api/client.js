import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Authorization header if JWT token exists in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicfix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 Unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('civicfix_token');
      localStorage.removeItem('civicfix_user');
    }
    return Promise.reject(error);
  }
);

// Helper function to resolve backend image URLs
export const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/600x400?text=No+Image';
  if (path.startsWith('http')) return path;
  const backendHost = import.meta.env.VITE_API_BASE_URL 
    ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') 
    : 'http://localhost:8000';
  return `${backendHost}${path}`;
};

// API Services
export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (data) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
};

export const issueApi = {
  create: (formData) => apiClient.post('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyIssues: () => apiClient.get('/issues/mine'),
  getNearby: (lat, lng, radius = 5000, category = '', statusFilter = '') =>
    apiClient.get(`/issues/nearby?lat=${lat}&lng=${lng}&radius=${radius}&category=${category}&status_filter=${statusFilter}`),
  getDetails: (id) => apiClient.get(`/issues/${id}`),
  support: (id) => apiClient.post(`/issues/${id}/support`),
  getHistory: (id) => apiClient.get(`/issues/${id}/history`),
};

export const adminApi = {
  getIssues: (params = {}) => apiClient.get('/admin/issues', { params }),
  getDetails: (id) => apiClient.get(`/admin/issues/${id}`),
  updateStatus: (id, data) => apiClient.patch(`/admin/issues/${id}/status`, data),
  assign: (id, data) => apiClient.post(`/admin/issues/${id}/assign`, data),
  merge: (id, data) => apiClient.post(`/admin/issues/${id}/merge`, data),
  uploadResolutionPhoto: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post(`/admin/issues/${id}/resolution-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  verifyResolution: (id) => apiClient.post(`/admin/issues/${id}/verify-resolution`),
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getCategoryAnalytics: () => apiClient.get('/admin/analytics/categories'),
  getStatusAnalytics: () => apiClient.get('/admin/analytics/status'),
  getPriorityAnalytics: () => apiClient.get('/admin/analytics/priority'),
};
