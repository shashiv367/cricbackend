-- Backfill player_name from profiles where missing (run once in Supabase SQL editor if needed).
UPDATE match_player_stats AS mps
SET player_name = COALESCE(
  NULLIF(TRIM(p.full_name), ''),
  NULLIF(TRIM(p.username), ''),
  NULLIF(TRIM(p.phone), '')
)
FROM profiles AS p
WHERE mps.player_id = p.id
  AND (mps.player_name IS NULL OR TRIM(mps.player_name) = '');
