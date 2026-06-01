export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function authFetch(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...options.headers,
  };

  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 422) {
      if (body.errors) {
        const firstKey = Object.keys(body.errors)[0];
        throw new Error(body.errors[firstKey][0]);
      } else if (Object.keys(body).length > 0) {
        // Handle flat error object like {"email": ["Error message"]}
        const firstKey = Object.keys(body)[0];
        if (Array.isArray(body[firstKey])) {
          throw new Error(body[firstKey][0]);
        } else if (typeof body[firstKey] === 'string') {
          throw new Error(body[firstKey]);
        }
      }
    }
    throw new Error(body.message || body.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const checkEmail = (email) =>
  authFetch('/auth/check-email', { method: 'POST', body: JSON.stringify({ email }) });

export const login = (email, password) =>
  authFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const requestAccess = (name, email, password) =>
  authFetch('/auth/request-access', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const logout = () =>
  authFetch('/auth/logout', { method: 'POST' });

export const fetchUser = () =>
  authFetch('/user', { method: 'GET' });

export const updatePassword = (current_password, password, password_confirmation) =>
  authFetch('/user/password', { method: 'PUT', body: JSON.stringify({ current_password, password, password_confirmation }) });

export const fetchAllUsers = () =>
  authFetch('/admin/users', { method: 'GET' });

export const toggleUserActive = (userId) =>
  authFetch(`/admin/users/${userId}/activate`, { method: 'PUT' });

export const deleteUser = (userId) =>
  authFetch(`/admin/users/${userId}`, { method: 'DELETE' });

export const createAdminUser = (name, email, password) =>
  authFetch('/admin/users', { method: 'POST', body: JSON.stringify({ name, email, password }) });
