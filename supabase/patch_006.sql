-- patch_006.sql — Add max_possible recalculation after group stage matches.
-- After each group match the function recomputes both teams' max possible points.
--
-- Rule: max_possible can only decrease, never increase.
-- Formula: LEAST(previous_max, total_points + remaining_games×3 + 4 + 39)
--
-- Examples after round 1 (starting from default 50):
--   Win  (3 pts, 2 remaining): LEAST(50, 3+6+4+39=52) = 50  (unchanged)
--   Draw (1 pt,  2 remaining): LEAST(50, 1+6+4+39=50) = 50  (unchanged)
--   Loss (0 pts, 2 remaining): LEAST(50, 0+6+4+39=49) = 49  (correctly reduced)

CREATE OR REPLACE FUNCTION update_team_max_possible(p_team_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_played      int;
  v_remaining   int;
  v_current     int;
  v_prev_max    int;
  v_computed    int;
  v_new_max     int;
BEGIN
  -- Count completed group matches this team has played
  SELECT COUNT(*) INTO v_played
  FROM matches
  WHERE stage = 'group'
    AND status = 'complete'
    AND (home_team_id = p_team_id OR away_team_id = p_team_id);

  v_remaining := GREATEST(0, 3 - v_played);

  -- Get current accumulated points and previous max
  SELECT COALESCE(total_points, 0), COALESCE(max_possible_points, 50)
  INTO v_current, v_prev_max
  FROM team_status
  WHERE team_id = p_team_id;

  -- Theoretical max from this point forward
  v_computed := v_current + (v_remaining * 3) + 4 + 39;

  -- Never allow max to increase — cap at previous value
  v_new_max := LEAST(v_prev_max, v_computed);

  UPDATE team_status
  SET max_possible_points = v_new_max,
      updated_at          = now()
  WHERE team_id = p_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_team_max_possible TO service_role;

-- One-time recalculation for teams that have already played group matches
-- (Mexico, South Africa, South Korea, Czechia after round 1).
-- Safe to run multiple times — just recomputes from current state.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT team_id FROM team_status LOOP
    PERFORM update_team_max_possible(r.team_id);
  END LOOP;
END;
$$;
