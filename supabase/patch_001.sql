-- patch_001.sql
-- 1. Make teams and app_settings publicly readable (no auth required)
-- 2. Add count_entries() RPC for leaderboard pre-lock count
-- 3. Update team records with FIFA rankings and betting odds

-- ─── 1. PUBLIC READ FOR TEAMS ───────────────────────────────────────────────
drop policy if exists "teams: authenticated read" on public.teams;
create policy "teams: public read" on public.teams
  for select using (true);

-- ─── 2. PUBLIC READ FOR APP_SETTINGS ────────────────────────────────────────
drop policy if exists "app_settings: authenticated read" on public.app_settings;
create policy "app_settings: public read" on public.app_settings
  for select using (true);

-- ─── 3. COUNT_ENTRIES RPC ────────────────────────────────────────────────────
create or replace function public.count_entries()
returns integer
language sql
security definer
stable
as $$
  select count(*)::integer from public.entries;
$$;

grant execute on function public.count_entries() to anon, authenticated;

-- ─── 4. FIFA RANKINGS (April 2026) ───────────────────────────────────────────
-- Source: FIFA/Coca-Cola Men's World Ranking, April 2026
update public.teams set fifa_rank = 1  where id = 'france';
update public.teams set fifa_rank = 2  where id = 'spain';
update public.teams set fifa_rank = 3  where id = 'argentina';
update public.teams set fifa_rank = 4  where id = 'england';
update public.teams set fifa_rank = 5  where id = 'portugal';
update public.teams set fifa_rank = 6  where id = 'brazil';
update public.teams set fifa_rank = 7  where id = 'netherlands';
update public.teams set fifa_rank = 8  where id = 'germany';
update public.teams set fifa_rank = 9  where id = 'colombia';
update public.teams set fifa_rank = 10 where id = 'italy'; -- not in tournament, placeholder
update public.teams set fifa_rank = 11 where id = 'belgium';
update public.teams set fifa_rank = 12 where id = 'croatia';
update public.teams set fifa_rank = 13 where id = 'morocco';
update public.teams set fifa_rank = 14 where id = 'switzerland';
update public.teams set fifa_rank = 15 where id = 'united-states';
update public.teams set fifa_rank = 16 where id = 'mexico';
update public.teams set fifa_rank = 17 where id = 'japan';
update public.teams set fifa_rank = 18 where id = 'senegal';
update public.teams set fifa_rank = 19 where id = 'austria';
update public.teams set fifa_rank = 20 where id = 'uruguay';
update public.teams set fifa_rank = 21 where id = 'turkey';
update public.teams set fifa_rank = 22 where id = 'sweden';
update public.teams set fifa_rank = 23 where id = 'ecuador';
update public.teams set fifa_rank = 24 where id = 'norway';
update public.teams set fifa_rank = 25 where id = 'south-korea';
update public.teams set fifa_rank = 26 where id = 'egypt';
update public.teams set fifa_rank = 27 where id = 'canada';
update public.teams set fifa_rank = 28 where id = 'algeria';
update public.teams set fifa_rank = 29 where id = 'czechia';
update public.teams set fifa_rank = 30 where id = 'cote-divoire';
update public.teams set fifa_rank = 31 where id = 'ghana';
update public.teams set fifa_rank = 32 where id = 'paraguay';
update public.teams set fifa_rank = 33 where id = 'iran';
update public.teams set fifa_rank = 34 where id = 'south-africa';
update public.teams set fifa_rank = 35 where id = 'australia';
update public.teams set fifa_rank = 36 where id = 'scotland';
update public.teams set fifa_rank = 37 where id = 'tunisia';
update public.teams set fifa_rank = 38 where id = 'dr-congo';
update public.teams set fifa_rank = 39 where id = 'qatar';
update public.teams set fifa_rank = 40 where id = 'saudi-arabia';
update public.teams set fifa_rank = 41 where id = 'bosnia-and-herzegovina';
update public.teams set fifa_rank = 42 where id = 'uzbekistan';
update public.teams set fifa_rank = 43 where id = 'new-zealand';
update public.teams set fifa_rank = 44 where id = 'panama';
update public.teams set fifa_rank = 45 where id = 'cabo-verde';
update public.teams set fifa_rank = 46 where id = 'iraq';
update public.teams set fifa_rank = 47 where id = 'jordan';
update public.teams set fifa_rank = 48 where id = 'curacao';
update public.teams set fifa_rank = 49 where id = 'haiti';

-- ─── 5. TITLE ODDS (DraftKings, April 2026) ──────────────────────────────────
update public.teams set title_odds = '+450'  where id = 'spain';
update public.teams set title_odds = '+600'  where id = 'france';
update public.teams set title_odds = '+600'  where id = 'england';
update public.teams set title_odds = '+850'  where id = 'brazil';
update public.teams set title_odds = '+850'  where id = 'argentina';
update public.teams set title_odds = '+1100' where id = 'portugal';
update public.teams set title_odds = '+1400' where id = 'germany';
update public.teams set title_odds = '+2000' where id = 'netherlands';
update public.teams set title_odds = '+2800' where id = 'norway';
update public.teams set title_odds = '+3500' where id = 'belgium';
update public.teams set title_odds = '+4000' where id = 'colombia';
update public.teams set title_odds = '+5000' where id = 'japan';
update public.teams set title_odds = '+6000' where id = 'morocco';
update public.teams set title_odds = '+6500' where id = 'united-states';
update public.teams set title_odds = '+6500' where id = 'uruguay';
update public.teams set title_odds = '+6500' where id = 'turkey';
update public.teams set title_odds = '+7000' where id = 'mexico';
update public.teams set title_odds = '+8000' where id = 'ecuador';
update public.teams set title_odds = '+8000' where id = 'sweden';
update public.teams set title_odds = '+9000' where id = 'croatia';
update public.teams set title_odds = '+10000' where id = 'switzerland';
update public.teams set title_odds = '+12000' where id = 'austria';
update public.teams set title_odds = '+12000' where id = 'senegal';
update public.teams set title_odds = '+15000' where id = 'south-korea';
update public.teams set title_odds = '+15000' where id = 'egypt';
update public.teams set title_odds = '+15000' where id = 'canada';
update public.teams set title_odds = '+20000' where id = 'cote-divoire';
update public.teams set title_odds = '+20000' where id = 'czechia';
update public.teams set title_odds = '+20000' where id = 'paraguay';
update public.teams set title_odds = '+25000' where id = 'ghana';
update public.teams set title_odds = '+25000' where id = 'algeria';
update public.teams set title_odds = '+30000' where id = 'iran';
update public.teams set title_odds = '+30000' where id = 'australia';
update public.teams set title_odds = '+30000' where id = 'scotland';
update public.teams set title_odds = '+40000' where id = 'bosnia-and-herzegovina';
update public.teams set title_odds = '+40000' where id = 'dr-congo';
update public.teams set title_odds = '+40000' where id = 'tunisia';
update public.teams set title_odds = '+50000' where id = 'qatar';
update public.teams set title_odds = '+50000' where id = 'saudi-arabia';
update public.teams set title_odds = '+50000' where id = 'south-africa';
update public.teams set title_odds = '+75000' where id = 'uzbekistan';
update public.teams set title_odds = '+75000' where id = 'new-zealand';
update public.teams set title_odds = '+75000' where id = 'panama';
update public.teams set title_odds = '+100000' where id = 'cabo-verde';
update public.teams set title_odds = '+150000' where id = 'iraq';
update public.teams set title_odds = '+150000' where id = 'jordan';
update public.teams set title_odds = '+200000' where id = 'curacao';
update public.teams set title_odds = '+200000' where id = 'haiti';

-- ─── 6. GROUP WIN ODDS (DraftKings, April 2026) ──────────────────────────────
-- Format: decimal multiplier displayed as e.g. "-140" or "+120"
update public.teams set group_win_odds = '-180' where id = 'france';       -- Group I
update public.teams set group_win_odds = '-200' where id = 'spain';        -- Group H
update public.teams set group_win_odds = '-175' where id = 'brazil';       -- Group C
update public.teams set group_win_odds = '-220' where id = 'england';      -- Group L
update public.teams set group_win_odds = '-160' where id = 'argentina';    -- Group J
update public.teams set group_win_odds = '-150' where id = 'portugal';     -- Group K
update public.teams set group_win_odds = '-170' where id = 'germany';      -- Group E
update public.teams set group_win_odds = '-140' where id = 'netherlands';  -- Group F
update public.teams set group_win_odds = '-130' where id = 'belgium';      -- Group G
update public.teams set group_win_odds = '-120' where id = 'colombia';     -- Group K
update public.teams set group_win_odds = '-150' where id = 'norway';       -- Group I
update public.teams set group_win_odds = '+180' where id = 'morocco';      -- Group C
update public.teams set group_win_odds = '+200' where id = 'switzerland';  -- Group B
update public.teams set group_win_odds = '+150' where id = 'uruguay';      -- Group H
update public.teams set group_win_odds = '+160' where id = 'japan';        -- Group F
update public.teams set group_win_odds = '-110' where id = 'mexico';       -- Group A
update public.teams set group_win_odds = '+120' where id = 'united-states'; -- Group D
update public.teams set group_win_odds = '+180' where id = 'canada';       -- Group B
update public.teams set group_win_odds = '+300' where id = 'croatia';      -- Group L
update public.teams set group_win_odds = '+220' where id = 'ecuador';      -- Group E
update public.teams set group_win_odds = '+350' where id = 'austria';      -- Group J
update public.teams set group_win_odds = '+200' where id = 'turkey';       -- Group D
update public.teams set group_win_odds = '+300' where id = 'cote-divoire'; -- Group E
update public.teams set group_win_odds = '+400' where id = 'czechia';      -- Group A
update public.teams set group_win_odds = '+280' where id = 'senegal';      -- Group I
update public.teams set group_win_odds = '+350' where id = 'south-korea';  -- Group A
update public.teams set group_win_odds = '+400' where id = 'sweden';       -- Group F
update public.teams set group_win_odds = '+450' where id = 'algeria';      -- Group J
update public.teams set group_win_odds = '-110' where id = 'egypt';        -- Group G
update public.teams set group_win_odds = '+300' where id = 'paraguay';     -- Group D
update public.teams set group_win_odds = '+600' where id = 'bosnia-and-herzegovina'; -- Group B
update public.teams set group_win_odds = '+500' where id = 'ghana';        -- Group L
update public.teams set group_win_odds = '+550' where id = 'iran';         -- Group G
update public.teams set group_win_odds = '+500' where id = 'australia';    -- Group D
update public.teams set group_win_odds = '+700' where id = 'dr-congo';     -- Group K
update public.teams set group_win_odds = '+600' where id = 'scotland';     -- Group C
update public.teams set group_win_odds = '+700' where id = 'tunisia';      -- Group F
update public.teams set group_win_odds = '+1200' where id = 'qatar';       -- Group B
update public.teams set group_win_odds = '+800' where id = 'saudi-arabia'; -- Group H
update public.teams set group_win_odds = '+800' where id = 'south-africa'; -- Group A
update public.teams set group_win_odds = '+900' where id = 'new-zealand';  -- Group G
update public.teams set group_win_odds = '+1500' where id = 'panama';      -- Group L
update public.teams set group_win_odds = '+1200' where id = 'uzbekistan';  -- Group K
update public.teams set group_win_odds = '+2000' where id = 'iraq';        -- Group I
update public.teams set group_win_odds = '+2500' where id = 'jordan';      -- Group J
update public.teams set group_win_odds = '+3000' where id = 'cabo-verde';  -- Group H
update public.teams set group_win_odds = '+5000' where id = 'curacao';     -- Group E
update public.teams set group_win_odds = '+5000' where id = 'haiti';       -- Group C
