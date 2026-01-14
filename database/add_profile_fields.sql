-- Add profile picture and team name fields to profiles table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS team_name TEXT;

-- Add comment
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to the profile picture stored in Supabase Storage avatars bucket';
COMMENT ON COLUMN profiles.team_name IS 'Player team name';

