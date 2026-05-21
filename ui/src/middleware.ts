import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('pokehub_session');

  if (!session) {
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl, { status: 307 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/search/:path*', '/collection/:path*', '/admin/:path*'],
};
