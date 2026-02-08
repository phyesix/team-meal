-- Add has_car column to team_members table
-- Run this migration in Supabase SQL Editor

ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS has_car BOOLEAN DEFAULT false;

COMMENT ON COLUMN team_members.has_car IS 'Whether this team member has a car for driving';
