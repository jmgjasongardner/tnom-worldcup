-- patch_011.sql — Set winner_team_id for three PSO Round of 32 matches
-- Run in the Supabase SQL editor after patch_010.sql.
--
-- Context:
--   Germany vs Paraguay   1-1 AET → Paraguay wins 4-3 on pens
--   Netherlands vs Morocco 1-1 AET → Morocco wins 3-2 on pens
--   Australia vs Egypt     1-1 AET → Egypt wins 4-2 on pens
--
-- The update-scores function (before the patch_010 fix) happened to assign
-- the win to the away team whenever scores were tied — which was wrong in
-- general but coincidentally correct for all three matches above (each was
-- won by the away side). So team_status points and scoring_events are
-- already correct. Only winner_team_id needs to be populated so that
-- bracketEngine.ts can propagate these slots into the Round of 16 bracket.

UPDATE public.matches
SET    winner_team_id = 'paraguay'
WHERE  stage          = 'round_of_32'
  AND  home_team_id   = 'germany'
  AND  away_team_id   = 'paraguay'
  AND  winner_team_id IS NULL;

UPDATE public.matches
SET    winner_team_id = 'morocco'
WHERE  stage          = 'round_of_32'
  AND  home_team_id   = 'netherlands'
  AND  away_team_id   = 'morocco'
  AND  winner_team_id IS NULL;

UPDATE public.matches
SET    winner_team_id = 'egypt'
WHERE  stage          = 'round_of_32'
  AND  home_team_id   = 'australia'
  AND  away_team_id   = 'egypt'
  AND  winner_team_id IS NULL;

-- Confirm — all four PSO matches should now have winner_team_id populated.
SELECT m.stage,
       ht.country AS home,
       at.country AS away,
       m.home_score,
       m.away_score,
       m.winner_team_id
FROM   public.matches m
JOIN   public.teams ht ON ht.id = m.home_team_id
JOIN   public.teams at ON at.id = m.away_team_id
WHERE  m.stage   != 'group'
  AND  m.status   = 'complete'
  AND  m.home_score = m.away_score
ORDER  BY m.played_at;
