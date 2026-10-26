// Utility for managing cookies that sync seamlessly across root domains and all subdomains
// (e.g. between whatthegoy.com and play.whatthegoy.com, games.whatthegoy.com, etc.)

export function getRootDomain(): string {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;

  // Don't set domain attribute for IPs, localhost, or public suffixes like github.io
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.match(/^\d+\.\d+\.\d+\.\d+$/) ||
    hostname.endsWith('.github.io') ||
    hostname.endsWith('.run.app') ||
    hostname.endsWith('.vercel.app')
  ) {
    return hostname;
  }

  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // Return .domain.com so cookies are accessible by root domain and all subdomains
    return '.' + parts.slice(-2).join('.');
  }
  return hostname;
}

export function setSharedCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const root = getRootDomain();
  const domainPart = root.startsWith('.') ? `; domain=${root}` : '';
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${domainPart}`;
}

export function getSharedCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

export function removeSharedCookie(name: string) {
  if (typeof document === 'undefined') return;
  const root = getRootDomain();
  const domainPart = root.startsWith('.') ? `; domain=${root}` : '';
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${domainPart}`;
}
