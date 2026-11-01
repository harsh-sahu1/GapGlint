/**
 * Resolves the backend API base URL for GapGlint.
 * 
 * - In Production: Uses VITE_API_BASE_URL (e.g. "https://gapglint-backend.vercel.app")
 * - In Local Development: If VITE_API_BASE_URL is unset/empty, returns ""
 *   which sends relative requests (e.g. "/api/...") that the Vite proxy handles.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const apiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};
