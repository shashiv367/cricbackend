-- Verify that profile_picture_url and team_name columns exist in the profiles table
-- Run this in Supabase SQL Editor to check

SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('profile_picture_url', 'team_name')
ORDER BY column_name;

-- If the above query returns 2 rows, the columns exist
-- If it returns 0 or 1 row, you need to run the ALTER TABLE command from add_profile_fields.sql

