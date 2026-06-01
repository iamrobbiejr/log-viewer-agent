const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Generic fetch wrapper with consistent error handling.
 */
async function apiFetch(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);

  // Strip undefined/null params before appending
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });

  const headers = {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  };
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${response.status}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────────────────────────

/** Fetch all machines with online/offline status */
export const fetchMachines = () =>
  apiFetch('/machines');

/** Fetch available log dates for a machine */
export const fetchAvailableLogs = (machineId) =>
  apiFetch(`/machines/${machineId}/logs`);

/**
 * Fetch log entries for a machine on a specific date.
 * @param {string} machineId
 * @param {string} date         - Format: YYYY-MM-DD
 * @param {object} filters      - { search, level, page, page_size }
 */
export const fetchLogsForDate = (machineId, date, filters = {}) =>
  apiFetch(`/machines/${machineId}/logs/${date}`, filters);
