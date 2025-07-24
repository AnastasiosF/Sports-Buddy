-- Complete Sports RLS Policy Fix
-- This script completely resets and fixes the RLS policies for user_sports

-- First, disable RLS temporarily to clean up
ALTER TABLE user_sports DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for user_sports
DROP POLICY IF EXISTS "Users can view own sports" ON user_sports;
DROP POLICY IF EXISTS "Anyone can view user sports" ON user_sports;
DROP POLICY IF EXISTS "Users can insert own sports" ON user_sports;
DROP POLICY IF EXISTS "Users can update own sports" ON user_sports;
DROP POLICY IF EXISTS "Users can delete own sports" ON user_sports;

-- Re-enable RLS
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies that allow authenticated users to manage sports
CREATE POLICY "Select user sports" ON user_sports
  FOR SELECT USING (true);

CREATE POLICY "Insert own user sports" ON user_sports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own user sports" ON user_sports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Delete own user sports" ON user_sports
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure sports table is also accessible
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read sports (they're public data)
DROP POLICY IF EXISTS "Sports are viewable by everyone" ON sports;
CREATE POLICY "Sports are viewable by everyone" ON sports
  FOR SELECT USING (true);

-- Also ensure profiles table has proper policies for sports join queries
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view profiles (needed for profile with sports queries)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Allow users to update their own profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (for signup)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Add missing sports data
INSERT INTO sports (name, description, min_players, max_players) VALUES
('Baseball', 'Bat and ball sport played between two teams', 2, 18),
('Hockey', 'Sport played with sticks and a puck/ball', 2, 20),
('Cricket', 'Bat and ball sport with wickets', 2, 22),
('Rugby', 'Team sport with an oval ball', 2, 30)
ON CONFLICT (name) DO NOTHING;

-- Add updated_at column if it doesn't exist
ALTER TABLE user_sports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sports_sport_id ON user_sports (sport_id);
CREATE INDEX IF NOT EXISTS idx_user_sports_user_id ON user_sports (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sports_preferred ON user_sports (user_id, preferred) WHERE preferred = true;

-- Show current policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('user_sports', 'sports', 'profiles')
ORDER BY tablename, policyname;