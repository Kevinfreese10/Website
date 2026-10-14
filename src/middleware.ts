import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const hostname = rawHost.split(':')[0].toLowerCase();

  // Force 301 Permanent Redirect from apex non-www (myacc.co.za) to canonical www (www.myacc.co.za)
  if (hostname === 'myacc.co.za') {
    const url = request.nextUrl.clone();
    url.hostname = 'www.myacc.co.za';
    url.protocol = 'https';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all requests except internal Next.js assets, API routes, and static files
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
