-- patch_009.sql — Fix premature third-place elimination from patch_008
-- Run this entire file in the Supabase SQL editor.
-- ============================================================
-- BUG
-- patch_008's reconcile_third_place_advancement() decides who advanced as
-- a top-8 third-place team by checking whether the team already has a
-- recorded `round_of_32` match. But patch_008 called that function
-- immediately as its last step — and Round of 32 runs Jun 28–Jul 3, 2026,
-- so at the moment the patch was run, ZERO round_of_32 matches existed
-- for ANY team yet (the round had not been played). Every one of the 12
-- third-place teams failed the "did they play a round_of_32 match" check,
-- so all 12 got marked eliminated — including the 8 that actually
-- qualified (e.g. Senegal), not just the 4 that didn't (e.g. Uruguay).
--
-- FIX
--   1. Harden reconcile_third_place_advancement() itself: refuse to do
--      anything until 16 round_of_32 matches are recorded complete. The
--      Netlify scheduled function already gated its call to this RPC the
--      same way, but the RPC could still be run directly from the SQL
--      editor (as patch_008 did) without that gate. Baking the gate into
--      the function closes that hole for good.
--   2. Directly correct the 8 real-world-confirmed qualifiers using the
--      now-final FIFA third-place table (group stage concluded June 27,
--      2026): DR Congo, Sweden, Ecuador, Ghana, Bosnia and Herzegovina,
--      Algeria, Paraguay, Senegal. Restores is_alive / current_stage /
--      advanced_from_group, awards the +1 bonus (idempotent — skips teams
--      already credited), and recomputes max_possible_points now that
--      they're alive again. The other 4 third-place teams (Uruguay among
--      them) were correctly identified as non-qualifiers by patch_008 and
--      are left untouched.
-- ============================================================

-- 1. Harden reconcile_third_place_advancement(): do nothing until all 16
--    Round of 32 matches are actually recorded complete.
CREATE OR REPLACE FUNCTION reconcile_third_place_advancement()
RETURNS TABLE(team_id text, action text) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  r                 record;
  v_played_r32      boolean;
  v_already_bonused boolean;
  v_r32_complete    int;
BEGIN
  SELECT COUNT(*) INTO v_r32_complete
  FROM matches
  WHERE stage = 'round_of_32' AND status = 'complete';

  IF v_r32_complete < 16 THEN
    RETURN; -- not all Round of 32 matches are in yet — do nothing
  END IF;

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

        UPDATE team_status ts
        SET current_stage = 'round_of_32', is_alive = true
        WHERE ts.team_id = r.team_id AND ts.current_stage = 'group';

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

-- 2. Directly correct the 8 confirmed third-place qualifiers (real-world
--    final third-place table — group stage concluded June 27, 2026).
--    Safe to re-run: skips the +1 bonus if already awarded.
DO $$
DECLARE
  qualifiers text[] := ARRAY[
    'dr-congo', 'sweden', 'ecuador', 'ghana',
    'bosnia-and-herzegovina', 'algeria', 'paraguay', 'senegal'
  ];
  slug text;
  v_already_bonused boolean;
BEGIN
  FOREACH slug IN ARRAY qualifiers LOOP
    SELECT EXISTS (
      SELECT 1 FROM scoring_events se
      WHERE se.team_id = slug AND se.event_type = 'third_place_advance'
    ) INTO v_already_bonused;

    UPDATE team_status ts
    SET is_alive            = true,
        current_stage       = 'round_of_32',
        advanced_from_group = true,
        group_finish_bonus  = ts.group_finish_bonus + (CASE WHEN v_already_bonused THEN 0 ELSE 1 END),
        updated_at          = now()
    WHERE ts.team_id = slug;

    IF NOT v_already_bonused THEN
      INSERT INTO scoring_events (team_id, event_type, stage, points, label)
      VALUES (slug, 'third_place_advance', 'group', 1,
              'Advanced as one of the best third-place teams (+1)');
    END IF;

    -- Recompute max_possible_points now that this team is alive again.
    PERFORM update_team_max_possible(slug);
  END LOOP;
END;
$$;

-- 3. Sanity check — confirm final state of all 12 third-place teams.
--    Expect 8 rows with is_alive = true / current_stage = round_of_32,
--    and 4 rows (incl. Uruguay) with is_alive = false / current_stage = group.
SELECT t.country, ts.team_id, ts.is_alive, ts.current_stage,
       ts.group_finish_bonus, ts.total_points, ts.max_possible_points
FROM team_status ts
JOIN teams t ON t.id = ts.team_id
WHERE ts.group_finish = 3
ORDER BY ts.is_alive DESC, t.country;
