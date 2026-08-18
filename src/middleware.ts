import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {config as appConfig} from '@/lib/config';
import {decodeSession} from '@/lib/session';

export function middleware(request: NextRequest) {
  const raw = request.cookies.get(appConfig.sessionCookie)?.value;
  const user = decodeSession(raw);
  const isLogin = request.nextUrl.pathname === '/login';

  if (!user && !isLogin) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    if (raw) {
      response.cookies.delete(appConfig.sessionCookie);
    }
    return response;
  }

  if (user && isLogin) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
