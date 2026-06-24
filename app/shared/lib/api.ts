import axios from 'axios';

function getApiUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return envUrl;

  const globalUrl = (window as any).__APPWRITE_FUNCTION_URL;
  if (globalUrl) return globalUrl;

  const hostname = window.location.hostname;
  if (hostname.endsWith('.appwrite.app')) {
    const projectId = hostname.split('.')[0];
    const functionId = (window as any).__APPWRITE_FUNCTION_ID || 'campgo-api';
    return `https://functions.appwrite.org/v1/custom/${projectId}/${functionId}`;
  }

  return '/api/v1';
}

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() ?? '')) {
    const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
    const csrfToken = match ? match[1] : '';
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken && error.config && !error.config._retry) {
        error.config._retry = true;
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
          const { access_token } = res.data;
          localStorage.setItem('accessToken', access_token);
          error.config.headers.Authorization = `Bearer ${access_token}`;
          return api(error.config);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
