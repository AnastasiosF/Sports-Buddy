-- Sports Selection Improvements Migration
-- This SQL script improves the RLS policies for user_sports to allow public viewing while maintaining security

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own sports" ON user_sports;

-- Create new policy that allows viewing all user sports (for public profiles)
-- while maintaining write restrictions
CREATE POLICY "Anyone can view user sports" ON user_sports FOR SELECT USING (true);

-- Ensure users can only manage their own sports
CREATE POLICY "Users can insert own sports" ON user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sports" ON user_sports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sports" ON user_sports FOR DELETE USING (auth.uid() = user_id);

-- Add index for better performance on sport lookups
CREATE INDEX IF NOT EXISTS idx_user_sports_sport_id ON user_sports (sport_id);

-- Add constraint to ensure preferred sports are marked as selected
-- (This is a business logic constraint - users can't prefer a sport they don't have)
-- Note: This constraint is optional and can be added based on business requirements

-- Ensure the sports table has proper data
-- Insert any missing default sports if they don't exist
INSERT INTO sports (name, description, min_players, max_players) VALUES
('Baseball', 'Bat and ball sport played between two teams', 2, 18),
('Hockey', 'Sport played with sticks and a puck/ball', 2, 20),
('Cricket', 'Bat and ball sport with wickets', 2, 22),
('Rugby', 'Team sport with an oval ball', 2, 30)
ON CONFLICT (name) DO NOTHING;

-- Update the trigger function to ensure updated_at is maintained
-- This ensures any updates to user_sports track when they were last modified
ALTER TABLE user_sports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for user_sports updated_at
CREATE OR REPLACE FUNCTION update_user_sports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_sports_updated_at ON user_sports;
CREATE TRIGGER update_user_sports_updated_at 
    BEFORE UPDATE ON user_sports
    FOR EACH ROW EXECUTE PROCEDURE update_user_sports_updated_at();

-- Add helpful comments to the table
COMMENT ON TABLE user_sports IS 'Junction table linking users to their selected sports with skill levels and preferences';
COMMENT ON COLUMN user_sports.skill_level IS 'User skill level for this specific sport';
COMMENT ON COLUMN user_sports.preferred IS 'Whether this is a preferred/favorite sport for the user';
COMMENT ON COLUMN user_sports.updated_at IS 'When this user-sport relationship was last modified';

-- Optional: Add a view for easy querying of user sports with sport details
CREATE OR REPLACE VIEW user_sports_detailed AS
SELECT 
    us.id,
    us.user_id,
    us.sport_id,
    us.skill_level,
    us.preferred,
    us.created_at,
    us.updated_at,
    s.name as sport_name,
    s.description as sport_description,
    s.min_players,
    s.max_players,
    p.full_name as user_name,
    p.username
FROM user_sports us
JOIN sports s ON us.sport_id = s.id
JOIN profiles p ON us.user_id = p.id;

-- Grant appropriate permissions on the view
GRANT SELECT ON user_sports_detailed TO authenticated;

-- Performance optimization: Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_sports_user_preferred ON user_sports (user_id, preferred) WHERE preferred = true;
CREATE INDEX IF NOT EXISTS idx_user_sports_skill_level ON user_sports (skill_level);

-- Add helpful statistics function (optional)
CREATE OR REPLACE FUNCTION get_sport_popularity()
RETURNS TABLE(sport_name TEXT, user_count BIGINT, avg_skill_level NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.name::TEXT,
        COUNT(us.user_id) as user_count,
        ROUND(AVG(
            CASE us.skill_level
                WHEN 'beginner' THEN 1
                WHEN 'intermediate' THEN 2
                WHEN 'advanced' THEN 3
                WHEN 'expert' THEN 4
                ELSE 2
            END
        ), 2) as avg_skill_level
    FROM sports s
    LEFT JOIN user_sports us ON s.id = us.sport_id
    GROUP BY s.id, s.name
    ORDER BY user_count DESC, s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_sport_popularity() TO authenticated;