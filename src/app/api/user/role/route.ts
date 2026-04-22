// app/api/user/role/route.ts
// Returns the authenticated user's role from the verified JWT payload.

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error, role: null, isAdmin: false },
      { status: auth.status },
    );
  }

  const role = (auth.payload as Record<string, unknown>).role ?? null;
  const isAdmin = role === 'admin';
  return NextResponse.json({ success: true, role, isAdmin });
}
