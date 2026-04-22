// POST /api/milestone/save — run calculation, persist the result into
// milestone_calculations, and (if projectId is provided) update
// projects.truck_load_date. Returns { calculationId, result }.

import { NextRequest, NextResponse } from 'next/server';
import {
  parseCoreRequest,
  computeCalculation,
  coerceDate,
  serialiseResult,
} from '@/lib/milestone-api-shared';
import {
  createMilestoneCalculation,
  updateProjectTruckLoadDate,
  type InsertMilestoneCalculation,
} from '@/lib/milestone-db';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function toIsoDate(date: Date | null): string | null {
  if (!date) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

  const b = body as Record<string, unknown>;
  const projectId = typeof b.projectId === 'string' && b.projectId.length > 0 ? b.projectId : null;
  const projectName = typeof b.projectName === 'string' && b.projectName.length > 0
    ? b.projectName
    : null;
  if (!projectName) {
    return NextResponse.json({ error: 'projectName is required' }, { status: 400 });
  }

  const clientName = typeof b.clientName === 'string' ? b.clientName : null;
  const projectRef = typeof b.projectRef === 'string' ? b.projectRef : null;
  const bumpInDate = coerceDate(b.bumpInDate);
  const showOpenDate = coerceDate(b.showOpenDate);
  const bumpOutDate = coerceDate(b.bumpOutDate);

  let calculationId: string;
  let serialised: unknown;
  let projectUpdateWarning: string | null = null;

  try {
    const { result } = await computeCalculation(parsed.parsed, { bumpInDate, showOpenDate });
    serialised = serialiseResult(result);

    const row: InsertMilestoneCalculation = {
      project_id: projectId,
      project_name: projectName,
      client_name: clientName,
      project_ref: projectRef,
      truck_leave_date: toIsoDate(parsed.parsed.truckLeaveDate)!,
      bump_in_date: toIsoDate(bumpInDate),
      show_open_date: toIsoDate(showOpenDate),
      bump_out_date: toIsoDate(bumpOutDate),
      build_type: parsed.parsed.input.buildType,
      stand_size: parsed.parsed.input.standSize,
      av_complexity: parsed.parsed.input.avComplexity,
      fabrication_intensity: parsed.parsed.input.fabricationIntensity,
      brief_clarity: parsed.parsed.input.briefClarity,
      engineering_required: parsed.parsed.input.engineeringRequired,
      long_lead_items: parsed.parsed.input.longLeadItems,
      concept_design_scope: parsed.parsed.input.conceptDesignScope ?? 'xzibit',
      graphics_scope: parsed.parsed.input.graphicsScope ?? 'xzibit',
      av_content_scope: parsed.parsed.input.avContentScope ?? 'xzibit',
      active_stages: parsed.parsed.input.activeStages ?? ['concept_design', 'production', 'onsite', 'post_show'],
      info_gates: parsed.parsed.infoGates as unknown as Record<string, boolean>,
      ci: result.ci,
      bucket: result.bucket,
      info_completeness: result.infoCompleteness,
      total_working_days: result.totalWorkingDays,
      project_start_date: toIsoDate(result.projectStartDate),
      bump_in_warning: result.bumpInWarning ?? null,
      tasks: result.tasks.map((t) => ({
        ...t,
        startDate: toIsoDate(t.startDate),
        endDate: toIsoDate(t.endDate),
      })),
    };

    calculationId = await createMilestoneCalculation(row);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('/api/milestone/save calculation insert failed:', message);
    return NextResponse.json(
      { error: 'Failed to save calculation', details: message },
      { status: 500 },
    );
  }

  // The calculation row is safe on disk now. If the optional project update
  // fails we still want to return the row id and warn — don't drop the save.
  if (projectId) {
    try {
      await updateProjectTruckLoadDate(projectId, parsed.parsed.truckLeaveDate);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('/api/milestone/save project update failed:', message);
      projectUpdateWarning = `Calculation saved (id=${calculationId}), but updating projects.truck_load_date failed: ${message}`;
    }
  }

  return NextResponse.json({
    calculationId,
    result: serialised,
    warning: projectUpdateWarning,
  });
}
