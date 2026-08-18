import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Clerk session Bearer token
api.interceptors.request.use(async (config) => {
  try {
    if (window.Clerk && window.Clerk.session) {
      const token = await window.Clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn('Failed to retrieve Clerk token for API request:', err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const userApi = {
  getMe: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  completeProfile: async ({ phoneNumber, city, mobile }) => {
    const response = await api.patch('/api/users/me/profile', {
      phoneNumber: phoneNumber || mobile,
      city: city || '',
    });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/users/me', data);
    return response.data;
  },
};

export default api;
