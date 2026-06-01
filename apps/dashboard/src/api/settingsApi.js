const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function apiFetch(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
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
    throw new Error(body.error ?? body.message ?? `HTTP ${response.status}`);
  }

  return response.json();
}

/** Fetch public settings safe for unauthenticated users */
export const fetchPublicSettings = () =>
  apiFetch('/settings/public');

/** Fetch all settings (Admin Only) */
export const fetchAllSettings = () =>
  apiFetch('/settings');

/** Update settings (Admin Only) */
export const updateSettings = (settingsMap) =>
  apiFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(settingsMap),
  });
