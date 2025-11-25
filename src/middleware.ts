import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Check for token in URL params (from Xzibit Apps redirect)
  const urlToken = searchParams.get('access_token');
  
  // Get the authentication token from cookies
  const token = request.cookies.get('auth_token')?.value;
  
  // If token is in URL, set it as cookie and redirect to clean URL
  if (urlToken) {
    const response = NextResponse.redirect(new URL(pathname, request.url));
    
    // Set the auth token cookie for this domain
    response.cookies.set('auth_token', urlToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    
    return response;
  }
  
  // All routes require authentication - if no token, redirect to login
  if (!token) {
    // Redirect to Xzibit Apps login page
    const xzibitAppsUrl = process.env.NEXT_PUBLIC_XZIBIT_APPS_URL || 'http://localhost:3000';
    const loginUrl = `${xzibitAppsUrl}/login`;
    
    // Store the original URL to redirect back after login
    const redirectUrl = new URL(loginUrl);
    redirectUrl.searchParams.set('redirect', request.url);
    
    return NextResponse.redirect(redirectUrl);
  }
  
  // Allow access if token exists
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

