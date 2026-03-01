import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const resp = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
          localStorage.setItem('access_token', resp.data.access_token);
          localStorage.setItem('refresh_token', resp.data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${resp.data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/users/me');

// Teams
export const fetchTeams = () => api.get('/teams');
export const createTeam = (data) => api.post('/teams', data);
export const fetchTeam = (id) => api.get(`/teams/${id}`);

// Users
export const fetchUsers = () => api.get('/users');

// Issues
export const fetchIssues = (params) => api.get('/issues', { params });
export const createIssue = (data) => api.post('/issues', data);
export const fetchIssue = (id) => api.get(`/issues/${id}`);
export const updateIssue = (id, data) => api.put(`/issues/${id}`, data);
export const deleteIssue = (id) => api.delete(`/issues/${id}`);
export const fetchStats = () => api.get('/issues/stats');

export default api;
