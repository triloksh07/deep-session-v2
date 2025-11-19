import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  const { pathname } = req.nextUrl;

  // Only protect the (authed) paths
  if (pathname.startsWith('/(authed)') && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/(auth)/login';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ['/((authed))/ :path*'] };
