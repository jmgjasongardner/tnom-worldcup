-- patch_005.sql — Relax read-only RLS policies to allow unauthenticated (anon) reads.
-- The app removed Supabase auth; these tables contain non-sensitive read data.
-- Writes still require is_admin() (service role only via SECURITY DEFINER functions).

-- app_settings: everyone can read lock status (needed by frontend to show locked state)
DROP POLICY IF EXISTS "app_settings: authenticated read" ON public.app_settings;
CREATE POLICY "app_settings: anon read"
  ON public.app_settings FOR SELECT
  USING (true);

-- scoring_events: public scoring data, safe to read without auth
DROP POLICY IF EXISTS "scoring_events: authenticated read" ON public.scoring_events;
CREATE POLICY "scoring_events: anon read"
  ON public.scoring_events FOR SELECT
  USING (true);

-- matches: public tournament results, safe to read without auth
DROP POLICY IF EXISTS "matches: authenticated read" ON public.matches;
CREATE POLICY "matches: anon read"
  ON public.matches FOR SELECT
  USING (true);

-- team_status: public scoring data, safe to read without auth
DROP POLICY IF EXISTS "team_status: authenticated read" ON public.team_status;
CREATE POLICY "team_status: anon read"
  ON public.team_status FOR SELECT
  USING (true);

-- teams: public reference data, safe to read without auth
DROP POLICY IF EXISTS "teams: authenticated read" ON public.teams;
CREATE POLICY "teams: anon read"
  ON public.teams FOR SELECT
  USING (true);
