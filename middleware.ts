import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl.clone();

  // Extract subdomain from hostname
  // Expected: subdomain.edgemarketplacehub.com
  const mainDomain = 'edgemarketplacehub.com';
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');

  if (!isLocalhost && hostname.endsWith(`.${mainDomain}`)) {
    const subdomain = hostname.replace(`.${mainDomain}`, '');

    // Skip www and other reserved subdomains
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      // Rewrite to the store page
      url.pathname = `/store/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes
     * - _next/static
     * - _next/image
     * - favicon.ico
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
