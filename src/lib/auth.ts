// JWT verification helpers for /api/* route handlers.
// Auth Correctness Sprint Fix #4 — mirrors the canonical pattern established
// by Capacity Planner Fix #3 (xzibit-apps/capacity-planner#7,
// kb_decisions 83fcbbd9-cf34-4094-807f-3b1f07499a1c).
//
// Middleware excludes /api/* from the auth-redirect. Every /api handler must
// therefore gate itself explicitly — verifyAuth for reads and user-owned
// writes, verifyAdmin for shared-state / destructive writes.

import { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '');

export type AuthResult =
  | { ok: true; payload: JWTPayload }
  | { ok: false; status: number; error: string };

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  if (process.env.NODE_ENV === 'development') {
    return {
      ok: true,
      payload: {
        role: 'admin',
        userId: 'dev-user',
        email: 'dev@localhost',
      } as JWTPayload,
    };
  }
  if (!process.env.JWT_SECRET) {
    return { ok: false, status: 500, error: 'JWT_SECRET not configured' };
  }
  const token = request.cookies.get('auth_token')?.value;
  if (!token) return { ok: false, status: 401, error: 'Missing auth token' };
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { ok: true, payload };
  } catch {
    return { ok: false, status: 401, error: 'Invalid token' };
  }
}

export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  const result = await verifyAuth(request);
  if (!result.ok) return result;
  const role = (result.payload as Record<string, unknown>).role;
  if (role !== 'admin') {
    return { ok: false, status: 403, error: 'Admin required' };
  }
  return result;
}
