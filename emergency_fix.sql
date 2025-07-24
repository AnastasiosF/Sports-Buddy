-- EMERGENCY FIX - Temporarily disable RLS for testing
-- WARNING: This removes security, use only for testing

ALTER TABLE user_sports DISABLE ROW LEVEL SECURITY;
ALTER TABLE sports DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing with proper policies:
-- ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sports ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;