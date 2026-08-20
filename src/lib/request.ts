import {ApiError} from '@/api/errors';

import {config} from '@/lib/config';

import {getApiToken} from '@/lib/session';

import {mockRequest} from '@/api/mock';



// Paths served by halacoach-apis under /api/admin/v1.

// Everything else falls back to mocks until implemented.

function isRealApiPath(path: string): boolean {

  return path.startsWith('/v1/');

}



async function readErrorMessage(res: Response): Promise<string> {

  const text = await res.text();

  if (!text) {

    return `API ${res.status}`;

  }

  try {

    const parsed = JSON.parse(text) as {message?: string};

    return parsed.message ?? text;

  } catch {

    return text;

  }

}



async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {

  const base = config.apiBaseUrl.replace(/\/$/, '');

  const token = getApiToken();

  const res = await fetch(`${base}${path}`, {

    ...init,

    headers: {

      'Content-Type': 'application/json',

      ...(token ? {Authorization: `Bearer ${token}`} : {}),

      ...init?.headers,

    },

  });



  if (!res.ok) {

    throw new ApiError(res.status, await readErrorMessage(res));

  }



  return res.json() as Promise<T>;

}



export async function request<T>(path: string, init?: RequestInit): Promise<T> {

  if (config.apiBaseUrl && isRealApiPath(path)) {

    return apiRequest<T>(path, init);

  }

  return mockRequest<T>(path, init);

}

