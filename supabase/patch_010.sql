-- patch_010.sql — Penalty shootout support + fix Colombia/Switzerland result
-- Run this entire file in the Supabase SQL editor.
-- ============================================================
-- BUG
-- update-scores.mts determined the knockout winner by comparing
-- homeScore > awayScore. When a match goes to a penalty shootout
-- the regulation/AET score stored by ESPN is TIED (e.g. 1–1),
-- so this condition is always false and the away team was always
-- awarded the win — regardless of who actually won the penalties.
--
-- Specific incorrect result: Colombia vs Switzerland (Round of 16,
-- Match 96).  Switzerland won on penalties but Colombia was
-- incorrectly recorded as the winner, given +5 knockout points,
-- and advanced to 'quarterfinal'; Switzerland was incorrectly
-- eliminated.
--
-- FIX
--   1. Add winner_team_id column to matches — set to the real
--      winning team slug even when scores are level (PSO games).
--   2. Correct the Colombia/Switzerland match row.
--   3. Reverse Colombia's incorrect +5 and elimination status.
--   4. Award Switzerland the correct +5 and advance them.
--   5. Fix scoring_events for both teams.
-- ============================================================

-- 1. Add winner_team_id column (nullable — only needed for PSO results;
--    for decisive matches the winner is already implied by the score).
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS winner_team_id text REFERENCES public.teams(id);

-- 2. Mark the correct winner on the Colombia vs Switzerland match.
UPDATE public.matches
SET    winner_team_id = 'switzerland'
WHERE  stage = 'round_of_16'
  AND  home_team_id IN ('switzerland', 'colombia')
  AND  away_team_id IN ('switzerland', 'colombia');

-- 3a. Reverse Colombia's incorrectly-awarded round_of_16 win (+5 pts).
UPDATE public.team_status
SET    knockout_points  = knockout_points - 5,
       current_stage    = 'round_of_16',
       updated_at       = now()
WHERE  team_id = 'colombia';

-- 3b. Eliminate Colombia (the actual loser) and freeze their max.
UPDATE public.team_status
SET    is_alive             = false,
       updated_at           = now()
WHERE  team_id = 'colombia';

UPDATE public.team_status
SET    max_possible_points  = total_points,   -- generated col — read back current value
       updated_at           = now()
WHERE  team_id = 'colombia';

-- 4a. Award Switzerland the round_of_16 win and advance them.
UPDATE public.team_status
SET    knockout_points = knockout_points + 5,
       current_stage   = 'quarterfinal',
       is_alive        = true,
       updated_at      = now()
WHERE  team_id = 'switzerland';

-- 4b. Recompute Switzerland's max_possible now that they're alive in the QF.
DO $$ BEGIN
  PERFORM update_team_max_possible('switzerland');
END $$;

-- 5a. Remove Colombia's incorrect round_of_16_win scoring event.
DELETE FROM public.scoring_events
WHERE  team_id    = 'colombia'
  AND  event_type = 'round_of_16_win';

-- 5b. Insert Switzerland's correct round_of_16_win scoring event
--     (idempotent — skips if already present).
INSERT INTO public.scoring_events (team_id, event_type, stage, points, label)
SELECT 'switzerland', 'round_of_16_win', 'round_of_16', 5, 'Won round of 16 (+5)'
WHERE  NOT EXISTS (
  SELECT 1 FROM public.scoring_events
  WHERE  team_id = 'switzerland' AND event_type = 'round_of_16_win'
);

-- ── Diagnostic — confirm final state ────────────────────────────────────────
-- Expect: Colombia → is_alive=false, knockout_points unchanged from before
--         Switzerland → is_alive=true, current_stage=quarterfinal, +5 knockout pts
SELECT t.country,
       ts.is_alive,
       ts.current_stage,
       ts.knockout_points,
       ts.total_points,
       ts.max_possible_points
FROM   public.team_status ts
JOIN   public.teams t ON t.id = ts.team_id
WHERE  ts.team_id IN ('switzerland', 'colombia')
ORDER  BY t.country;

-- ── Audit — any other knockout matches stored with a tied score ──────────────
-- Run this to check if any other PSO games need winner_team_id set manually.
SELECT m.id,
       m.stage,
       ht.country AS home,
       at.country AS away,
       m.home_score,
       m.away_score,
       m.winner_team_id
FROM   public.matches m
JOIN   public.teams ht ON ht.id = m.home_team_id
JOIN   public.teams at ON at.id = m.away_team_id
WHERE  m.stage != 'group'
  AND  m.status = 'complete'
  AND  m.home_score = m.away_score
ORDER  BY m.played_at;
