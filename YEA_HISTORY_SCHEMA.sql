-- YEA Suite V1.7 Geçmiş İstatistik Merkezi
-- RPYS tablolarından tamamen bağımsızdır.
BEGIN;

CREATE TABLE IF NOT EXISTS public.yea_shift_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
  source_type text NOT NULL DEFAULT 'auto' CHECK (source_type IN ('auto','person_rows','unit_rows')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  record_count integer NOT NULL CHECK (record_count >= 0 AND record_count <= 30000),
  content_hash text NOT NULL CHECK (char_length(content_hash) = 64),
  records jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(records) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT yea_shift_imports_period_check CHECK (period_end >= period_start),
  CONSTRAINT yea_shift_imports_user_hash_key UNIQUE (user_id, content_hash)
);
CREATE INDEX IF NOT EXISTS yea_shift_imports_user_period_idx ON public.yea_shift_imports (user_id, period_start DESC);
ALTER TABLE public.yea_shift_imports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.yea_shift_imports FROM anon;
REVOKE ALL ON public.yea_shift_imports FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.yea_shift_imports TO authenticated;
GRANT ALL ON public.yea_shift_imports TO service_role;
DROP POLICY IF EXISTS "Users read own shift imports" ON public.yea_shift_imports;
CREATE POLICY "Users read own shift imports" ON public.yea_shift_imports FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users insert own shift imports" ON public.yea_shift_imports;
CREATE POLICY "Users insert own shift imports" ON public.yea_shift_imports FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users delete own shift imports" ON public.yea_shift_imports;
CREATE POLICY "Users delete own shift imports" ON public.yea_shift_imports FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.yea_shift_unit_rules (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_name text NOT NULL CHECK (char_length(unit_name) BETWEEN 1 AND 120),
  category text NOT NULL CHECK (category IN ('day','night','exclude')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, unit_name)
);
ALTER TABLE public.yea_shift_unit_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.yea_shift_unit_rules FROM anon;
REVOKE ALL ON public.yea_shift_unit_rules FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.yea_shift_unit_rules TO authenticated;
GRANT ALL ON public.yea_shift_unit_rules TO service_role;
DROP POLICY IF EXISTS "Users read own shift rules" ON public.yea_shift_unit_rules;
CREATE POLICY "Users read own shift rules" ON public.yea_shift_unit_rules FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users insert own shift rules" ON public.yea_shift_unit_rules;
CREATE POLICY "Users insert own shift rules" ON public.yea_shift_unit_rules FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users update own shift rules" ON public.yea_shift_unit_rules;
CREATE POLICY "Users update own shift rules" ON public.yea_shift_unit_rules FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users delete own shift rules" ON public.yea_shift_unit_rules;
CREATE POLICY "Users delete own shift rules" ON public.yea_shift_unit_rules FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

COMMIT;
