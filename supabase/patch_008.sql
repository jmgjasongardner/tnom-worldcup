-- patch_008.sql — Fix third-place group-finish advancement
-- Run this entire file in the Supabase SQL editor.
-- ============================================================
-- BUG
-- When a group finished, every 3rd-place team was immediately marked
-- is_alive = true and current_stage = 'round_of_32' — even though whether
-- a 3rd-place team actually advances depends on comparing all 12 groups'
-- third-place records (only the best 8 of 12 go through). The +1
-- "Finish 3rd and advance" bonus was also never implemented (it was left
-- as a manual TODO in update-scores.mts).
--
-- Net effect once Round of 32 actually played out:
--   - Teams that DID advance as a top-8 third place (e.g. Senegal) are
--     missing their +1 bonus.
--   - Teams that did NOT advance (e.g. Uruguay) are incorrectly shown
--     alive / "Round of 32" instead of Eliminated, and their
--     max_possible_points was never frozen.
--
-- FIX
--   1. add_group_finish_bonus RPC now also records group_finish (1-4).
--   2. New reconcile_third_place_advancement() RPC uses the ground-truth
--      `matches` table (did this team actually play a round_of_32 match?)
--      to award the +1 bonus to real qualifiers and correctly eliminate
--      non-qualifiers, freezing their max_possible_points.
--   3. One-time backfill: derive group_finish for all 48 teams from
--      completed group matches (it was never populated before), then run
--      the reconciliation immediately so existing data is corrected now.
-- ============================================================

-- 1. Extend add_group_finish_bonus to also persist group_finish (1-4)
--    Drop the old 4-arg signature first — CREATE OR REPLACE does NOT replace
--    a function when the parameter list changes, it creates an overload,
--    which then makes unqualified GRANT/calls ambiguous ("function name is
--    not unique"). Drop it explicitly so only one version exists.
DROP FUNCTION IF EXISTS add_group_finish_bonus(text, int, boolean, text);

CREATE OR REPLACE FUNCTION add_group_finish_bonus(
  p_team_id      text,
  p_bonus        int,
  p_is_alive     boolean,
  p_stage        text,
  p_group_finish int DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE team_status
  SET group_finish_bonus = group_finish_bonus + p_bonus,
      is_alive           = p_is_alive,
      current_stage      = p_stage,
      group_finish       = COALESCE(p_group_finish, group_finish),
      updated_at         = now()
  WHERE team_id = p_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION add_group_finish_bonus TO service_role;

-- 2. Reconcile 3rd-place advancement using ground-truth round_of_32 matches.
--    Safe to call repeatedly — skips teams already awarded the bonus.
CREATE OR REPLACE FUNCTION reconcile_third_place_advancement()
RETURNS TABLE(team_id text, action text) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r                 record;
  v_played_r32      boolean;
  v_already_bonused boolean;
BEGIN
  FOR r IN
    SELECT ts.team_id FROM team_status ts WHERE ts.group_finish = 3
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.stage = 'round_of_32'
        AND (m.home_team_id = r.team_id OR m.away_team_id = r.team_id)
    ) INTO v_played_r32;

    SELECT EXISTS (
      SELECT 1 FROM scoring_events se
      WHERE se.team_id = r.team_id AND se.event_type = 'third_place_advance'
    ) INTO v_already_bonused;

    IF v_played_r32 THEN
      IF NOT v_already_bonused THEN
        UPDATE team_status ts
        SET group_finish_bonus  = ts.group_finish_bonus + 1,
            advanced_from_group = true,
            updated_at          = now()
        WHERE ts.team_id = r.team_id;

        -- Only bump stage/alive if still sitting pending at 'group' —
        -- don't clobber further progress already recorded from a R32+ result.
        UPDATE team_status ts
        SET current_stage = 'round_of_32', is_alive = true
        WHERE ts.team_id = r.team_id AND ts.current_stage = 'group';

        -- Keep max_possible_points consistent with the new +1 (covers teams
        -- already eliminated in R32 whose max was frozen before this bonus).
        UPDATE team_status ts
        SET max_possible_points = GREATEST(ts.max_possible_points, ts.total_points)
        WHERE ts.team_id = r.team_id;

        INSERT INTO scoring_events (team_id, event_type, stage, points, label)
        VALUES (r.team_id, 'third_place_advance', 'group', 1,
                'Advanced as one of the best third-place teams (+1)');

        team_id := r.team_id; action := 'advanced (+1 awarded)';
        RETURN NEXT;
      ELSE
        team_id := r.team_id; action := 'advanced (already awarded)';
        RETURN NEXT;
      END IF;
    ELSE
      UPDATE team_status ts
      SET advanced_from_group = false,
          is_alive            = false,
          current_stage       = 'group',
          max_possible_points = ts.total_points,
          updated_at          = now()
      WHERE ts.team_id = r.team_id;

      team_id := r.team_id; action := 'eliminated (did not advance)';
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION reconcile_third_place_advancement TO service_role;

-- 3. One-time backfill: derive group_finish (1-4) for every team from
--    completed group-stage matches (never populated before this patch).
--    Tiebreak order matches the JS logic in update-scores.mts:
--    points desc, goal difference desc, goals for desc, team id asc.
DO $$
DECLARE
  grp      record;
  ordered  text[];
  rank_idx int;
BEGIN
  FOR grp IN SELECT DISTINCT group_letter FROM teams LOOP
    WITH grp_teams AS (
      SELECT id FROM teams WHERE group_letter = grp.group_letter
    ),
    grp_matches AS (
      SELECT * FROM matches
      WHERE stage = 'group' AND status = 'complete'
        AND (home_team_id IN (SELECT id FROM grp_teams)
             OR away_team_id IN (SELECT id FROM grp_teams))
    ),
    per_team AS (
      SELECT gt.id AS team_id,
        COALESCE(SUM(CASE
          WHEN gm.home_team_id = gt.id AND gm.home_score > gm.away_score THEN 3
          WHEN gm.home_team_id = gt.id AND gm.home_score = gm.away_score THEN 1
          WHEN gm.away_team_id = gt.id AND gm.away_score > gm.home_score THEN 3
          WHEN gm.away_team_id = gt.id AND gm.away_score = gm.home_score THEN 1
          ELSE 0
        END), 0) AS pts,
        COALESCE(SUM(CASE
          WHEN gm.home_team_id = gt.id THEN gm.home_score - gm.away_score
          WHEN gm.away_team_id = gt.id THEN gm.away_score - gm.home_score
          ELSE 0
        END), 0) AS gd,
        COALESCE(SUM(CASE
          WHEN gm.home_team_id = gt.id THEN gm.home_score
          WHEN gm.away_team_id = gt.id THEN gm.away_score
          ELSE 0
        END), 0) AS gf
      FROM grp_teams gt
      LEFT JOIN grp_matches gm
        ON gm.home_team_id = gt.id OR gm.away_team_id = gt.id
      GROUP BY gt.id
    )
    SELECT array_agg(team_id ORDER BY pts DESC, gd DESC, gf DESC, team_id ASC)
    INTO ordered
    FROM per_team;

    IF ordered IS NOT NULL AND array_length(ordered, 1) = 4 THEN
      FOR rank_idx IN 1..4 LOOP
        UPDATE team_status
        SET group_finish = rank_idx
        WHERE team_id = ordered[rank_idx];
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

-- 4. Run the reconciliation immediately so existing data (Senegal, Uruguay,
--    and every other 3rd-place team) is corrected right now.
SELECT * FROM reconcile_third_place_advancement();
