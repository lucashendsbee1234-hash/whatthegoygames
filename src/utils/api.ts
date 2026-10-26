// Universal API router ensuring GitHub Pages, custom domains, and AI Studio
// all communicate with the EXACT same live shared backend.

export const SHARED_BACKEND_URL = '';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const customBackend = localStorage.getItem('wtg_backend_url');
  if (customBackend && customBackend.trim()) {
    return customBackend.trim().replace(/\/+$/, '');
  }

  // Always use same-origin relative paths by default.
  // This ensures domains, subdomains (e.g. play.domain.com), localhost,
  // and cloud containers all talk to their own origin without CORS preflight blocks.
  return '';
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}
