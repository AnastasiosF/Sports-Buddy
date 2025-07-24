-- Fixed Sports Selection Migration
-- This script applies only the remaining parts of the sports improvements

-- Skip policy creation if it already exists, just ensure other policies are in place
DO $$
BEGIN
    -- Create insert policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_sports' 
        AND policyname = 'Users can insert own sports'
    ) THEN
        CREATE POLICY "Users can insert own sports" ON user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Create update policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_sports' 
        AND policyname = 'Users can update own sports'
    ) THEN
        CREATE POLICY "Users can update own sports" ON user_sports FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    -- Create delete policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_sports' 
        AND policyname = 'Users can delete own sports'
    ) THEN
        CREATE POLICY "Users can delete own sports" ON user_sports FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add index for better performance on sport lookups
CREATE INDEX IF NOT EXISTS idx_user_sports_sport_id ON user_sports (sport_id);

-- Ensure the sports table has proper data
-- Insert any missing default sports if they don't exist
INSERT INTO sports (name, description, min_players, max_players) VALUES
('Baseball', 'Bat and ball sport played between two teams', 2, 18),
('Hockey', 'Sport played with sticks and a puck/ball', 2, 20),
('Cricket', 'Bat and ball sport with wickets', 2, 22),
('Rugby', 'Team sport with an oval ball', 2, 30)
ON CONFLICT (name) DO NOTHING;

-- Update the trigger function to ensure updated_at is maintained
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

-- Performance optimization: Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_sports_user_preferred ON user_sports (user_id, preferred) WHERE preferred = true;
CREATE INDEX IF NOT EXISTS idx_user_sports_skill_level ON user_sports (skill_level);

-- Show current policies for verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_sports';