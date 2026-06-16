-- patch_007.sql — Fix max_possible_points calculation.
--
-- Bugs fixed vs patch_006:
--
-- 1. The true theoretical max is 52 (3 group wins = 9pts + group 1st bonus = 4pts + full knockout = 39pts).
--    The DB default was 50, so LEAST(prev_max=50, computed=52) never let the cap rise to the
--    correct value, causing a team's first loss to drop max by only 1 (50→49) instead of 3 (52→49).
--
-- 2. After 2 losses a team can no longer win the group or finish 2nd. The max group bonus drops
--    from 4 (group winner) to 1 (best 3rd-place advance). The old formula kept using +4.
--
-- 3. After elimination (is_alive = false), max_possible = current earned points, no more.
--
-- Formula (per state):
--   not alive:         max = total_points                         (no more pts possible)
--   0–1 losses:        max = LEAST(52, current + remaining*3 + 4 + 39)
--   2 losses, 1 game:  max = LEAST(52, current + 3 + 1 + 39)   (best 3rd advance only)
--
-- Examples (fresh team, 0pts, 0 losses, 3 remaining):
--   initial state:  LEAST(52, 0+9+4+39=52) = 52  ← correct true max
-- After game 1:
--   win  (3pts, 1 loss=0, 2 rem): LEAST(52, 3+6+4+39=52)=52  unchanged ✓
--   draw (1pt,  1 loss=0, 2 rem): LEAST(52, 1+6+4+39=50)=50  -2 ✓
--   loss (0pts, 1 loss=1, 2 rem): LEAST(52, 0+6+4+39=49)=49  -3 ✓
-- After game 2 (started 0pts, lost game 1):
--   loss (0pts, 2 losses, 1 rem): LEAST(52, 0+3+1+39=43)=43  correct (2 losses→ group bonus capped at 1) ✓

CREATE OR REPLACE FUNCTION update_team_max_possible(p_team_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_played    int;
  v_losses    int;
  v_remaining int;
  v_current   int;
  v_is_alive  boolean;
  v_max_bonus int;
  v_computed  int;
BEGIN
  -- Get current accumulated points and alive status
  SELECT COALESCE(total_points, 0), COALESCE(is_alive, true)
  INTO v_current, v_is_alive
  FROM team_status
  WHERE team_id = p_team_id;

  -- Eliminated: max is frozen at whatever they've earned
  IF NOT v_is_alive THEN
    UPDATE team_status
    SET max_possible_points = v_current,
        updated_at          = now()
    WHERE team_id = p_team_id;
    RETURN;
  END IF;

  -- Count completed group games played
  SELECT COUNT(*) INTO v_played
  FROM matches
  WHERE stage = 'group'
    AND status = 'complete'
    AND (home_team_id = p_team_id OR away_team_id = p_team_id);

  -- Count losses in group stage
  SELECT COUNT(*) INTO v_losses
  FROM matches
  WHERE stage = 'group'
    AND status = 'complete'
    AND (
      (home_team_id = p_team_id AND home_score < away_score) OR
      (away_team_id = p_team_id AND away_score < home_score)
    );

  v_remaining := GREATEST(0, 3 - v_played);

  -- Max achievable group finish bonus:
  --   0–1 losses → can still win group → +4
  --   2 losses   → best case 3rd place advance → +1
  --   3 losses   → is_alive = false, handled above
  IF v_losses >= 2 THEN
    v_max_bonus := 1;
  ELSE
    v_max_bonus := 4;
  END IF;

  -- Theoretical max from current position:
  --   current earned pts + win every remaining group game + best group bonus + win every knockout match
  -- Cap at 52 (absolute max possible in the tournament).
  v_computed := LEAST(52, v_current + (v_remaining * 3) + v_max_bonus + 39);

  UPDATE team_status
  SET max_possible_points = v_computed,
      updated_at          = now()
  WHERE team_id = p_team_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_team_max_possible TO service_role;

-- Fix the column default so newly inserted team_status rows start at 52, not 50.
ALTER TABLE public.team_status
  ALTER COLUMN max_possible_points SET DEFAULT 52;

-- One-time recalculation for all existing teams.
-- Safe to run multiple times — always recomputes from current DB state.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT DISTINCT team_id FROM team_status LOOP
    PERFORM update_team_max_possible(r.team_id);
  END LOOP;
END;
$$;
