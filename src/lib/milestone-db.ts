// Supabase helpers used by the milestone API routes.
// Every call uses the service-role client — server-only.

import { getSupabaseAdmin } from './supabase-server';
import {
  CI_WEIGHTS,
  CI_THRESHOLDS,
  type CIWeights,
  type Thresholds,
  type TaskConfig,
  type ConfigOverride,
} from './milestone-engine';

export async function getMilestoneConfig(): Promise<ConfigOverride> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('milestone_config')
    .select('config_key, config_value');

  if (error) {
    // Fail soft — caller falls back to hardcoded defaults.
    console.error('milestone_config fetch failed:', error.message);
    return {};
  }

  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    if (typeof row.config_key === 'string') map[row.config_key] = row.config_value;
  }

  return {
    ciWeights: (map.ciWeights as CIWeights | undefined) ?? CI_WEIGHTS,
    thresholds: (map.thresholds as Thresholds | undefined) ?? CI_THRESHOLDS,
    tasks: map.tasks as TaskConfig[] | undefined,
  };
}

export type InsertMilestoneCalculation = {
  project_id: string | null;
  project_name: string;
  client_name: string | null;
  project_ref: string | null;
  truck_leave_date: string; // ISO date
  bump_in_date: string | null;
  show_open_date: string | null;
  bump_out_date: string | null;
  build_type: string;
  stand_size: string;
  av_complexity: string;
  fabrication_intensity: string;
  brief_clarity: string;
  engineering_required: boolean;
  long_lead_items: boolean;
  concept_design_scope: string;
  graphics_scope: string;
  av_content_scope: string;
  active_stages: string[];
  info_gates: Record<string, boolean>;
  ci: number;
  bucket: string;
  info_completeness: number;
  total_working_days: number;
  project_start_date: string | null;
  bump_in_warning: string | null;
  tasks: unknown; // json
  created_by?: string | null;
};

export async function createMilestoneCalculation(
  row: InsertMilestoneCalculation,
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('milestone_calculations')
    .insert(row)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to insert milestone calculation: ${error.message}`);
  if (!data?.id) throw new Error('Insert returned no id');
  return data.id as string;
}

export type MilestoneProjectRow = {
  id: string;
  project_number: string | null;
  name: string;
  client_name: string | null;
  truck_load_date: string | null;
  bump_in_date: string | null;
  show_open_date: string | null;
  bump_out_date: string | null;
};

export async function getProjectById(projectId: string): Promise<MilestoneProjectRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, project_number, name, truck_load_date, bump_in_date, show_open_date, bump_out_date, client:users!projects_client_id_fkey ( company_name, full_name )',
    )
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load project ${projectId}: ${error.message}`);
  if (!data) return null;

  const client = (data as { client?: { company_name?: string | null; full_name?: string | null } | null }).client;
  const client_name = client?.company_name ?? client?.full_name ?? null;

  return {
    id: data.id as string,
    project_number: (data.project_number as string | null) ?? null,
    name: data.name as string,
    client_name,
    truck_load_date: (data.truck_load_date as string | null) ?? null,
    bump_in_date: (data.bump_in_date as string | null) ?? null,
    show_open_date: (data.show_open_date as string | null) ?? null,
    bump_out_date: (data.bump_out_date as string | null) ?? null,
  };
}

export async function updateProjectTruckLoadDate(
  projectId: string,
  date: Date,
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const iso = toIsoDate(date);
  const { error } = await supabase
    .from('projects')
    .update({ truck_load_date: iso })
    .eq('id', projectId);

  if (error) throw new Error(`Failed to update project ${projectId}: ${error.message}`);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
