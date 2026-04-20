-- Shared non-working-day calendar
-- Used by Milestone Calculator (now) and Capacity Planner (future)
-- Sign-off: Joel Nebauer 2026-04-19

CREATE TABLE public.company_closures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('public_holiday', 'company_closure')),
  jurisdiction text NOT NULL CHECK (jurisdiction IN ('national','qld','nsw','vic','sa','wa','tas','nt','act','company')),
  active bool NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, jurisdiction)
);

CREATE INDEX idx_company_closures_date ON public.company_closures (date);
CREATE INDEX idx_company_closures_jurisdiction ON public.company_closures (jurisdiction);

ALTER TABLE public.company_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_closures_service_role_all
  ON public.company_closures
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY company_closures_anon_deny
  ON public.company_closures
  FOR ALL TO anon
  USING (false);

COMMENT ON TABLE public.company_closures IS
  'Shared non-working-day calendar. Used by Milestone Calculator and Capacity Planner. Public holidays by jurisdiction + Xzibit-specific company closures.';

-- Seed: national public holidays for 2026 and 2027 only.
-- The brief preferred a full state/territory seed from data.gov.au, but
-- the dataset (australian-holidays-machine-readable-dataset,
-- b1bc6077-dadd-4f61-9f8c-002ab2cdff10) is marked INACTIVE and carries
-- no 2026-2027 resources. Taking the brief's fallback path: seed
-- national only and track state/territory seeding as an open question.
-- See kb_decisions "Shared company_closures calendar table" and
-- kb_open_questions "company_closures state/territory seed follow-up".
INSERT INTO public.company_closures (date, name, type, jurisdiction) VALUES
  ('2026-01-01', 'New Year''s Day',   'public_holiday', 'national'),
  ('2026-01-26', 'Australia Day',     'public_holiday', 'national'),
  ('2026-04-03', 'Good Friday',       'public_holiday', 'national'),
  ('2026-04-06', 'Easter Monday',     'public_holiday', 'national'),
  ('2026-04-25', 'ANZAC Day',         'public_holiday', 'national'),
  ('2026-12-25', 'Christmas Day',     'public_holiday', 'national'),
  ('2026-12-26', 'Boxing Day',        'public_holiday', 'national'),
  ('2027-01-01', 'New Year''s Day',   'public_holiday', 'national'),
  ('2027-01-26', 'Australia Day',     'public_holiday', 'national'),
  ('2027-03-26', 'Good Friday',       'public_holiday', 'national'),
  ('2027-03-29', 'Easter Monday',     'public_holiday', 'national'),
  ('2027-04-25', 'ANZAC Day',         'public_holiday', 'national'),
  ('2027-12-25', 'Christmas Day',     'public_holiday', 'national'),
  ('2027-12-26', 'Boxing Day',        'public_holiday', 'national')
ON CONFLICT (date, jurisdiction) DO NOTHING;
