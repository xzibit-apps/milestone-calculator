// Server-only Supabase client configured with the service-role key.
//
// NEVER import this from a client component — the service role key bypasses
// RLS and must never be shipped to the browser. The "server-only" import
// below makes Next.js throw at build time if a client module pulls this in.

import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

function resolveUrl(): string {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'Supabase URL is not configured. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.',
    );
  }
  return url;
}

function resolveServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in Vercel project settings (and .env.local for dev).',
    );
  }
  return key;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(resolveUrl(), resolveServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}
