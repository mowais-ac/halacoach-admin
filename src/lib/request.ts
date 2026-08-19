import {config} from '@/lib/config';
import {mockRequest} from '@/api/mock';

// Paths that have real API endpoints implemented.
// Everything else falls back to mocks.
// Add new paths here as real APIs are built.
const REAL_API_PATHS = ['/admin/credit-packages'];

function isRealApiPath(path: string): boolean {
  return REAL_API_PATHS.some((prefix) => path.startsWith(prefix));
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const base = config.apiUrl.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `API ${res.status} ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (config.apiUrl && isRealApiPath(path)) {
    return apiRequest<T>(path, init);
  }
  return mockRequest<T>(path, init);
}
