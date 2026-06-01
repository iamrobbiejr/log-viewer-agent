const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function apiFetch(path, options = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers: { ...headers, ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  return response.json();
}

export const fetchAllMachines = () => apiFetch('/admin/machines');

export const createMachine = (data) => apiFetch('/admin/machines', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const updateMachine = (id, data) => apiFetch(`/admin/machines/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

export const deleteMachine = (id) => apiFetch(`/admin/machines/${id}`, {
  method: 'DELETE',
});
