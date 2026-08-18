import {config} from '@/lib/config';
import {mockRequest} from './mock';

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
  if (config.useMocks || !config.apiUrl) {
    return mockRequest<T>(path, init);
  }
  return apiRequest<T>(path, init);
}
