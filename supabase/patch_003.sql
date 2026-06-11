-- patch_003.sql
-- Sets bracket_lock_at to 3:00 PM ET on June 11, 2026 (= 19:00 UTC, since ET is UTC-4 in summer).
-- picks_locked stays FALSE — the admin flips it manually at kickoff via the Admin page.
--
-- Run in Supabase SQL Editor.

INSERT INTO app_settings (id, bracket_lock_at, picks_locked)
VALUES (true, '2026-06-11T19:00:00Z', false)
ON CONFLICT (id) DO UPDATE
  SET bracket_lock_at = EXCLUDED.bracket_lock_at,
      updated_at      = now();

-- To lock picks manually at kickoff, run:
--   UPDATE app_settings SET picks_locked = true WHERE id = true;
--
-- To unlock (emergency only):
--   UPDATE app_settings SET picks_locked = false WHERE id = true;
