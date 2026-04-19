-- Milestone Calculator schema migration
-- Sign-off: Joel Nebauer 2026-04-19 (see kb_decisions "truck_load_date on projects")

-- 1. projects.truck_load_date
ALTER TABLE public.projects
  ADD COLUMN truck_load_date date NULL;

COMMENT ON COLUMN public.projects.truck_load_date IS
  'Anchor date for Milestone Calculator back-scheduling. Written by Milestone Calculator when user confirms a calculation; readable by all apps. See kb_decisions.';

-- 2. milestone_calculations table
CREATE TABLE public.milestone_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NULL REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Snapshot at calculation time
  project_name text NOT NULL,
  client_name text NULL,
  project_ref text NULL,
  truck_leave_date date NOT NULL,
  bump_in_date date NULL,
  show_open_date date NULL,
  bump_out_date date NULL,

  -- CI inputs
  build_type text NOT NULL CHECK (build_type IN ('hire_only','hybrid','custom','engineered')),
  stand_size text NOT NULL CHECK (stand_size IN ('small','medium','large')),
  av_complexity text NOT NULL CHECK (av_complexity IN ('basic','medium','high')),
  fabrication_intensity text NOT NULL CHECK (fabrication_intensity IN ('standard','some_custom','heavy_custom')),
  brief_clarity text NOT NULL CHECK (brief_clarity IN ('clear','some_unknowns','vague')),
  engineering_required bool NOT NULL DEFAULT false,
  long_lead_items bool NOT NULL DEFAULT false,

  -- Scope toggles (defaults: Xzibit handles everything)
  concept_design_scope text NOT NULL DEFAULT 'xzibit' CHECK (concept_design_scope IN ('xzibit','client','off')),
  graphics_scope text NOT NULL DEFAULT 'xzibit' CHECK (graphics_scope IN ('xzibit','client','off')),
  av_content_scope text NOT NULL DEFAULT 'xzibit' CHECK (av_content_scope IN ('xzibit','client','off')),

  -- Stage toggles
  active_stages text[] NOT NULL DEFAULT ARRAY['concept_design','production','onsite','post_show']::text[],

  -- Info gates
  info_gates jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Computed outputs
  ci int NOT NULL,
  bucket text NOT NULL CHECK (bucket IN ('low','medium','high')),
  info_completeness numeric(3,2) NOT NULL,
  total_working_days int NOT NULL,
  project_start_date date NULL,
  bump_in_warning text NULL,
  tasks jsonb NOT NULL,

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestone_calculations_project_id ON public.milestone_calculations (project_id);
CREATE INDEX idx_milestone_calculations_created_at ON public.milestone_calculations (created_at DESC);

ALTER TABLE public.milestone_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY milestone_calculations_service_role_all
  ON public.milestone_calculations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY milestone_calculations_anon_deny
  ON public.milestone_calculations
  FOR ALL TO anon
  USING (false);

COMMENT ON TABLE public.milestone_calculations IS
  'Milestone Calculator run records. Snapshots inputs + stores computed schedule. Optional FK to projects.';

-- 3. milestone_config table
CREATE TABLE public.milestone_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL
);

ALTER TABLE public.milestone_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY milestone_config_service_role_all
  ON public.milestone_config
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY milestone_config_anon_deny
  ON public.milestone_config
  FOR ALL TO anon
  USING (false);

COMMENT ON TABLE public.milestone_config IS
  'Admin-editable Milestone Calculator config (CI weights, thresholds, task durations). Replaces filesystem JSON writes. Keyed by config_key.';

-- 4. Seed milestone_config with Manus defaults (tune later via admin panel)
INSERT INTO public.milestone_config (config_key, config_value) VALUES
  ('ciWeights', '{
    "buildType": {"hire_only": 1, "hybrid": 2, "custom": 3, "engineered": 4},
    "standSize": {"small": 1, "medium": 3, "large": 5},
    "avComplexity": {"basic": 1, "medium": 2, "high": 4},
    "fabricationIntensity": {"standard": 1, "some_custom": 3, "heavy_custom": 6},
    "briefClarity": {"clear": 0, "some_unknowns": 2, "vague": 5},
    "engineeringRequired": 3,
    "longLeadItems": 2
  }'::jsonb),
  ('thresholds', '{"lowMax": 8, "mediumMax": 15}'::jsonb);

-- Note: 'tasks' config deliberately unseeded.
-- Calculator falls back to hard-coded task list in code until an admin customises.
