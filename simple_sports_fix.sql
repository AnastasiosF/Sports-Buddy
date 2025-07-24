-- Simple Sports RLS Fix - Complete Reset
-- This script completely disables and rebuilds RLS for sports functionality

-- Temporarily disable RLS on all related tables
ALTER TABLE user_sports DISABLE ROW LEVEL SECURITY;
ALTER TABLE sports DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies to start fresh
DROP POLICY IF EXISTS "Users can view own sports" ON user_sports;
DROP POLICY IF EXISTS "Anyone can view user sports" ON user_sports;
DROP POLICY IF EXISTS "Select user sports" ON user_sports;
DROP POLICY IF EXISTS "Users can insert own sports" ON user_sports;
DROP POLICY IF EXISTS "Insert own user sports" ON user_sports;
DROP POLICY IF EXISTS "Users can update own sports" ON user_sports;
DROP POLICY IF EXISTS "Update own user sports" ON user_sports;
DROP POLICY IF EXISTS "Users can delete own sports" ON user_sports;
DROP POLICY IF EXISTS "Delete own user sports" ON user_sports;

DROP POLICY IF EXISTS "Sports are viewable by everyone" ON sports;
DROP POLICY IF EXISTS "Users can view sports" ON sports;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Re-enable RLS
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for user_sports
CREATE POLICY "user_sports_select_policy" ON user_sports FOR SELECT USING (true);
CREATE POLICY "user_sports_insert_policy" ON user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_sports_update_policy" ON user_sports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_sports_delete_policy" ON user_sports FOR DELETE USING (auth.uid() = user_id);

-- Create simple policy for sports (public read)
CREATE POLICY "sports_select_policy" ON sports FOR SELECT USING (true);

-- Create simple policies for profiles
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Grant necessary permissions to authenticated role
GRANT ALL ON user_sports TO authenticated;
GRANT SELECT ON sports TO authenticated;
GRANT ALL ON profiles TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('user_sports', 'sports', 'profiles')
ORDER BY tablename, policyname;