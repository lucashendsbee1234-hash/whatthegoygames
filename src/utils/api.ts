// Universal API router ensuring GitHub Pages, custom domains, and AI Studio
// all communicate with the EXACT same live shared backend.

export const SHARED_BACKEND_URL = 'https://ais-dev-yx3oibt644mxf2xqith77p-114522950003.us-east1.run.app';

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const customBackend = localStorage.getItem('wtg_backend_url');
  if (customBackend && customBackend.trim()) {
    return customBackend.trim().replace(/\/+$/, '');
  }

  // If already on the Cloud Run server, use relative path
  if (window.location.hostname.includes('run.app')) {
    return '';
  }

  // When deployed to GitHub Pages (e.g. github.io), Vercel, or custom domain,
  // route directly to the shared AI Studio backend so all devices sync together!
  return SHARED_BACKEND_URL;
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}
