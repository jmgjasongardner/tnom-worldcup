-- patch_004.sql — Live score updater support
-- Run this in Supabase SQL editor before deploying the Netlify update-scores function.

-- 1. Add espn_event_id to matches for idempotent processing
ALTER TABLE matches ADD COLUMN IF NOT EXISTS espn_event_id text UNIQUE;

-- 2. RPC: atomically add group match points to a team
CREATE OR REPLACE FUNCTION add_group_match_points(
  p_team_id text,
  p_points   int
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO team_status (team_id, group_match_points)
  VALUES (p_team_id, p_points)
  ON CONFLICT (team_id) DO UPDATE
    SET group_match_points = team_status.group_match_points + p_points,
        updated_at = now();
END;
$$;

-- 3. RPC: atomically add group finish bonus and optionally set is_alive / current_stage
CREATE OR REPLACE FUNCTION add_group_finish_bonus(
  p_team_id     text,
  p_bonus       int,
  p_is_alive    boolean,
  p_stage       text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE team_status
  SET group_finish_bonus = group_finish_bonus + p_bonus,
      is_alive           = p_is_alive,
      current_stage      = p_stage,
      updated_at         = now()
  WHERE team_id = p_team_id;
END;
$$;

-- 4. RPC: atomically record a knockout win (add points, advance stage)
CREATE OR REPLACE FUNCTION add_knockout_win(
  p_team_id   text,
  p_points    int,
  p_new_stage text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE team_status
  SET knockout_points = knockout_points + p_points,
      current_stage   = p_new_stage,
      updated_at      = now()
  WHERE team_id = p_team_id;
END;
$$;

-- 5. RPC: eliminate a team after a knockout loss
CREATE OR REPLACE FUNCTION eliminate_team(p_team_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE team_status
  SET is_alive            = false,
      max_possible_points = total_points,   -- generated col, so read & rewrite
      updated_at          = now()
  WHERE team_id = p_team_id;
  -- total_points is a generated column, so we re-read it:
  UPDATE team_status
  SET max_possible_points = (
    SELECT total_points FROM team_status WHERE team_id = p_team_id
  )
  WHERE team_id = p_team_id;
END;
$$;

-- 6. Grant execute to the service role (anon key cannot call these)
GRANT EXECUTE ON FUNCTION add_group_match_points   TO service_role;
GRANT EXECUTE ON FUNCTION add_group_finish_bonus   TO service_role;
GRANT EXECUTE ON FUNCTION add_knockout_win         TO service_role;
GRANT EXECUTE ON FUNCTION eliminate_team           TO service_role;
