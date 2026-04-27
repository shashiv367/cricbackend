-- Add extended profile fields to profiles table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS team_name TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS since TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS playing_role TEXT,
ADD COLUMN IF NOT EXISTS batting_style TEXT,
ADD COLUMN IF NOT EXISTS bowling_style TEXT,
ADD COLUMN IF NOT EXISTS dob TEXT;

-- Add comment
COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to the profile picture stored in Supabase Storage avatars bucket';
COMMENT ON COLUMN profiles.team_name IS 'Player team name';
COMMENT ON COLUMN profiles.city IS 'User city';
COMMENT ON COLUMN profiles.since IS 'User since year or label';
COMMENT ON COLUMN profiles.gender IS 'User gender';
COMMENT ON COLUMN profiles.playing_role IS 'Cricket playing role';
COMMENT ON COLUMN profiles.batting_style IS 'Batting style preference';
COMMENT ON COLUMN profiles.bowling_style IS 'Bowling style preference';
COMMENT ON COLUMN profiles.dob IS 'Date of birth';

