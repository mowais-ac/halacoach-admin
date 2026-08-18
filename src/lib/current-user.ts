import {cookies} from 'next/headers';
import type {SessionUser} from '@/api/types';
import {config} from '@/lib/config';
import {decodeSession} from '@/lib/session';

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return decodeSession(jar.get(config.sessionCookie)?.value);
}
