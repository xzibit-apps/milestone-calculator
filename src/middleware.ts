import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Base64Url → JSON decode helper (Edge-compatible)
function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    const decoded = atob(base64);
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(json);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // token coming from URL (redirect)
  const urlToken = searchParams.get('access_token');

  // token from cookies
  const token = request.cookies.get('auth_token')?.value;

  // If token in URL → store cookie + redirect to clean URL
  if (urlToken) {
    const response = NextResponse.redirect(new URL(pathname, request.url));

    response.cookies.set('auth_token', urlToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    // Security: Don't log actual token value - only log presence
    console.log('🔐 Token received via URL');

    return response;
  }

  // If no token → redirect to login
  if (!token) {
    const xzibitAppsUrl = process.env.NEXT_PUBLIC_XZIBIT_APPS_URL;
    
    // In production, require environment variable
    if (!xzibitAppsUrl && process.env.NODE_ENV === 'production') {
      console.error('❌ NEXT_PUBLIC_XZIBIT_APPS_URL environment variable is required in production');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Fallback to localhost only in development
    const loginUrl = xzibitAppsUrl 
      ? `${xzibitAppsUrl}/login`
      : 'http://localhost:3000/login';

    const redirectUrl = new URL(loginUrl);
    redirectUrl.searchParams.set('redirect', request.url);

    return NextResponse.redirect(redirectUrl);
  }

  // Decode token to get user role
  const payload = decodeJwt(token);
  // Security: Don't log actual payload - only log presence and role
  console.log('🔎 Token decoded successfully');

  // If payload null means token is not JWT or corrupted
  if (!payload) {
    console.log('❌ Token decode failed — not valid JWT format');
  }

  // Extract role from payload
  const userRole = payload?.role || null;
  const isAdmin = userRole === 'admin';

  // Check if accessing admin route - require admin role
  if (pathname.startsWith('/admin')) {
    if (!isAdmin) {
      console.log('❌ Access denied: Admin role required');
      // Redirect to home if not admin
      return NextResponse.redirect(new URL('/', request.url));
    }
    console.log('✅ Admin access granted');
  }

  // Create response and add role info to headers (for client-side access)
  const response = NextResponse.next();
  if (userRole) {
    response.headers.set('x-user-role', userRole);
    response.headers.set('x-is-admin', isAdmin ? 'true' : 'false');
  }

  return response;
}

// Match all routes except static files
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
