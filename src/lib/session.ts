import type {SessionUser} from '@/api/types';
import {config} from './config';

export function encodeSession(user: SessionUser) {
  return encodeURIComponent(JSON.stringify(user));
}

export function decodeSession(value: string | undefined | null): SessionUser | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as SessionUser;
    if (!parsed?.id || !parsed.email || !parsed.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionCookie(user: SessionUser) {
  document.cookie = `${config.sessionCookie}=${encodeSession(user)}; path=/; SameSite=Lax`;
}

export function clearSessionCookie() {
  document.cookie = `${config.sessionCookie}=; path=/; max-age=0`;
}
