// app/api/user/role/route.ts
// API route to get current user role from token

import { NextRequest, NextResponse } from 'next/server';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

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

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found', role: null, isAdmin: false },
        { status: 401 }
      );
    }

    // Decode token
    const payload = decodeJwt(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token', role: null, isAdmin: false },
        { status: 401 }
      );
    }

    const role = payload.role || null;
    const isAdmin = role === 'admin';

    return NextResponse.json({
      success: true,
      role: role,
      isAdmin: isAdmin,
    });
  } catch (error) {
    console.error('Error in /api/user/role:', error);
    return NextResponse.json(
      { error: 'Internal server error', role: null, isAdmin: false },
      { status: 500 }
    );
  }
}
