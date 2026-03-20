import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const getStoredToken = () => {
  const raw = localStorage.getItem('token');
  if (!raw) return null;

  const token = String(raw).trim();
  if (!token || token === 'undefined' || token === 'null') {
    localStorage.removeItem('token');
    return null;
  }

  return token;
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const normalizeUser = (user) => {
  if (!user) return null;
  if (!user._id && user.id) {
    return { ...user, _id: user.id };
  }
  return user;
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    return normalizeUser(user);
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  const normalized = normalizeUser(user);
  localStorage.setItem('user', JSON.stringify(normalized));
  window.dispatchEvent(new Event('authChanged'));
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('authChanged'));
};

export default api;
