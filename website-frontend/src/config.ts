const rawApiBase = import.meta.env.VITE_API_BASE || '';
export const API_BASE = rawApiBase.endsWith('/') ? rawApiBase.slice(0, -1) : rawApiBase;
export const API_URL = `${API_BASE}/api`;