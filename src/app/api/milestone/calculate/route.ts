// POST /api/milestone/calculate — preview-only calculation, no persistence.
// Returns the full CalculationResult for the given input + truck leave date.

import { NextRequest, NextResponse } from 'next/server';
import {
  parseCoreRequest,
  computeCalculation,
  serialiseResult,
} from '@/lib/milestone-api-shared';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseCoreRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const { result } = await computeCalculation(parsed.parsed);
    return NextResponse.json(serialiseResult(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('/api/milestone/calculate failed:', message);
    return NextResponse.json(
      { error: 'Calculation failed', details: message },
      { status: 500 },
    );
  }
}
