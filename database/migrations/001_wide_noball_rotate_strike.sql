-- Add strike-rotation toggles for wide / no-ball (run on existing Supabase DBs)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS wide_rotate_strike BOOLEAN DEFAULT FALSE;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS noball_rotate_strike BOOLEAN DEFAULT FALSE;
