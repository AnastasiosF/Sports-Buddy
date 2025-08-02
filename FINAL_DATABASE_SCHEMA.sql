-- ============================================================================
-- SPORTS BUDDY APP - FINAL CONSOLIDATED DATABASE SCHEMA
-- ============================================================================
-- This schema consolidates all migrations and fixes into a complete database setup
-- Last updated: 2025-08-02
-- Version: 1.0.0

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Sports table - defines available sports activities
CREATE TABLE sports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  min_players INTEGER DEFAULT 1,
  max_players INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  age INTEGER,
  skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  location GEOGRAPHY(POINT, 4326),
  location_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sports preferences - many-to-many relationship between users and sports
CREATE TABLE user_sports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES sports(id) ON DELETE CASCADE,
  skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  preferred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

-- Match requests/sessions
CREATE TABLE matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES sports(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  location_name VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 60, -- minutes
  max_participants INTEGER DEFAULT 2,
  skill_level_required VARCHAR(20) CHECK (skill_level_required IN ('any', 'beginner', 'intermediate', 'advanced', 'expert')) DEFAULT 'any',
  status VARCHAR(20) CHECK (status IN ('open', 'full', 'completed', 'cancelled')) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match participants - handles both invitations and join requests
-- This table manages the invitation system workflow
CREATE TABLE match_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Messages between users in match context
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User connections/friendships
CREATE TABLE user_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id)
);

-- Reviews/ratings for players
CREATE TABLE user_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reviewed_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewed_id, match_id),
  CHECK(reviewer_id != reviewed_id)
);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- User sports detailed view - combines user sports with sport details
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

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update user_sports updated_at column
CREATE OR REPLACE FUNCTION update_user_sports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to search users for friend requests
CREATE OR REPLACE FUNCTION search_users_for_friends(search_query TEXT, current_user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    relationship_status TEXT,
    connection_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.username,
        p.full_name,
        p.avatar_url,
        p.bio,
        CASE 
            WHEN uc_sent.id IS NOT NULL AND uc_sent.status = 'accepted' THEN 'friends'
            WHEN uc_received.id IS NOT NULL AND uc_received.status = 'accepted' THEN 'friends'
            WHEN uc_sent.id IS NOT NULL AND uc_sent.status = 'pending' THEN 'request_sent'
            WHEN uc_received.id IS NOT NULL AND uc_received.status = 'pending' THEN 'request_received'
            ELSE 'none'
        END::TEXT as relationship_status,
        COALESCE(uc_sent.id, uc_received.id) as connection_id
    FROM profiles p
    LEFT JOIN user_connections uc_sent ON (uc_sent.user_id = current_user_id AND uc_sent.friend_id = p.id)
    LEFT JOIN user_connections uc_received ON (uc_received.user_id = p.id AND uc_received.friend_id = current_user_id)
    WHERE 
        p.id != current_user_id 
        AND (
            p.username ILIKE '%' || search_query || '%' 
            OR p.full_name ILIKE '%' || search_query || '%'
        )
    ORDER BY p.username
    LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's friends list
CREATE OR REPLACE FUNCTION get_user_friends(current_user_id UUID)
RETURNS TABLE (
    connection_id UUID,
    friend_id UUID,
    friend_username TEXT,
    friend_full_name TEXT,
    friend_avatar_url TEXT,
    friend_bio TEXT,
    friend_location_name TEXT,
    friend_skill_level TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id as connection_id,
        p.id as friend_id,
        p.username as friend_username,
        p.full_name as friend_full_name,
        p.avatar_url as friend_avatar_url,
        p.bio as friend_bio,
        p.location_name as friend_location_name,
        p.skill_level as friend_skill_level,
        uc.created_at
    FROM user_connections uc
    JOIN profiles p ON (
        CASE 
            WHEN uc.user_id = current_user_id THEN p.id = uc.friend_id
            ELSE p.id = uc.user_id
        END
    )
    WHERE 
        (uc.user_id = current_user_id OR uc.friend_id = current_user_id)
        AND uc.status = 'accepted'
    ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests
CREATE OR REPLACE FUNCTION get_pending_friend_requests(current_user_id UUID)
RETURNS TABLE (
    connection_id UUID,
    requester_id UUID,
    requester_username TEXT,
    requester_full_name TEXT,
    requester_avatar_url TEXT,
    requester_bio TEXT,
    requester_location_name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id as connection_id,
        p.id as requester_id,
        p.username as requester_username,
        p.full_name as requester_full_name,
        p.avatar_url as requester_avatar_url,
        p.bio as requester_bio,
        p.location_name as requester_location_name,
        uc.created_at
    FROM user_connections uc
    JOIN profiles p ON p.id = uc.user_id
    WHERE 
        uc.friend_id = current_user_id
        AND uc.status = 'pending'
    ORDER BY uc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get sport popularity statistics
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to automatically update updated_at on matches
CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to automatically update updated_at on user_sports
CREATE TRIGGER update_user_sports_updated_at 
    BEFORE UPDATE ON user_sports
    FOR EACH ROW EXECUTE PROCEDURE update_user_sports_updated_at();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Spatial indexes for location-based queries
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_matches_location ON matches USING GIST (location);

-- Temporal indexes for time-based queries
CREATE INDEX idx_matches_scheduled_at ON matches (scheduled_at);

-- Foreign key indexes for joins
CREATE INDEX idx_matches_sport_id ON matches (sport_id);
CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_user_sports_user_id ON user_sports (user_id);
CREATE INDEX idx_user_sports_sport_id ON user_sports (sport_id);
CREATE INDEX idx_match_participants_match_id ON match_participants (match_id);
CREATE INDEX idx_match_participants_user_id ON match_participants (user_id);
CREATE INDEX idx_messages_match_id ON messages (match_id);

-- User connections indexes for friend system
CREATE INDEX idx_user_connections_user_id ON user_connections (user_id);
CREATE INDEX idx_user_connections_friend_id ON user_connections (friend_id);
CREATE INDEX idx_user_connections_status ON user_connections (status);
CREATE INDEX idx_user_connections_created_at ON user_connections (created_at);

-- Composite indexes for complex queries
CREATE INDEX idx_user_connections_status_users ON user_connections(status, user_id, friend_id);
CREATE INDEX idx_user_connections_pending_requests ON user_connections(friend_id, status) WHERE status = 'pending';
CREATE INDEX idx_user_connections_friends ON user_connections(user_id, friend_id, status) WHERE status = 'accepted';
CREATE INDEX idx_user_sports_user_preferred ON user_sports (user_id, preferred) WHERE preferred = true;
CREATE INDEX idx_user_sports_skill_level ON user_sports (skill_level);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;

-- Sports table policies (public read access)
CREATE POLICY "sports_select_policy" ON sports FOR SELECT USING (true);

-- Profiles table policies
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User sports policies
CREATE POLICY "user_sports_select_policy" ON user_sports FOR SELECT USING (true);
CREATE POLICY "user_sports_insert_policy" ON user_sports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_sports_update_policy" ON user_sports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_sports_delete_policy" ON user_sports FOR DELETE USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view all matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Users can create matches" ON matches FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Match creators can update own matches" ON matches FOR UPDATE USING (auth.uid() = created_by);

-- Match participants policies (supports invitation system)
CREATE POLICY "Users can view match participants" ON match_participants FOR SELECT USING (true);
CREATE POLICY "Users can join matches or be invited by creators" ON match_participants FOR INSERT WITH CHECK (
  -- Allow users to join matches themselves
  auth.uid() = user_id 
  OR 
  -- Allow match creators to invite users to their matches
  EXISTS (
    SELECT 1 FROM matches 
    WHERE matches.id = match_participants.match_id 
    AND matches.created_by = auth.uid()
  )
);
CREATE POLICY "Users can update own participation" ON match_participants FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Participants can view match messages" ON messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM match_participants 
    WHERE match_id = messages.match_id 
    AND user_id = auth.uid() 
    AND status = 'confirmed'
  )
);
CREATE POLICY "Participants can send messages" ON messages FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM match_participants 
    WHERE match_id = messages.match_id 
    AND user_id = auth.uid() 
    AND status = 'confirmed'
  )
);

-- User connections policies
CREATE POLICY "user_connections_select_own" ON user_connections
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "user_connections_insert_own" ON user_connections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "user_connections_update_addressee" ON user_connections
    FOR UPDATE
    USING (auth.uid() = friend_id AND status = 'pending')
    WITH CHECK (auth.uid() = friend_id AND status IN ('accepted', 'rejected'));

CREATE POLICY "user_connections_delete_own" ON user_connections
    FOR DELETE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Reviews policies
CREATE POLICY "Users can view all reviews" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON user_reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can update own reviews" ON user_reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT ON sports TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON user_sports TO authenticated;
GRANT ALL ON matches TO authenticated;
GRANT ALL ON match_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON user_connections TO authenticated;
GRANT ALL ON user_reviews TO authenticated;

-- Grant permissions on views
GRANT SELECT ON user_sports_detailed TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION search_users_for_friends(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_friends(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_friend_requests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sport_popularity() TO authenticated;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default sports
INSERT INTO sports (name, description, min_players, max_players) VALUES
('Tennis', 'Racket sport played on a court', 2, 4),
('Basketball', 'Team sport played with a ball and hoops', 2, 10),
('Football/Soccer', 'Sport played with a ball using feet', 2, 22),
('Volleyball', 'Sport played with a ball over a net', 2, 12),
('Badminton', 'Racket sport played with a shuttlecock', 2, 4),
('Table Tennis', 'Indoor racket sport', 2, 4),
('Running', 'Athletic activity', 1, NULL),
('Cycling', 'Bike riding activity', 1, NULL),
('Swimming', 'Water sport', 1, NULL),
('Golf', 'Sport played with clubs and balls', 1, 4),
('Baseball', 'Bat and ball sport played between two teams', 2, 18),
('Hockey', 'Sport played with sticks and a puck/ball', 2, 20),
('Cricket', 'Bat and ball sport with wickets', 2, 22),
('Rugby', 'Team sport with an oval ball', 2, 30)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE sports IS 'Available sports activities in the app';
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE user_sports IS 'Junction table linking users to their selected sports with skill levels and preferences';
COMMENT ON TABLE matches IS 'Sports matches/sessions created by users';
COMMENT ON TABLE match_participants IS 'Manages match participation including invitations and join requests';
COMMENT ON TABLE messages IS 'Chat messages within match context';
COMMENT ON TABLE user_connections IS 'Friend relationships between users';
COMMENT ON TABLE user_reviews IS 'User ratings and reviews after matches';

COMMENT ON COLUMN user_sports.skill_level IS 'User skill level for this specific sport';
COMMENT ON COLUMN user_sports.preferred IS 'Whether this is a preferred/favorite sport for the user';
COMMENT ON COLUMN match_participants.status IS 'pending=invited/requested, confirmed=joined, declined=rejected';
COMMENT ON COLUMN user_connections.status IS 'pending=request sent, accepted=friends, blocked=blocked user';

-- ============================================================================
-- SCHEMA VERSION INFO
-- ============================================================================

-- Create a table to track schema versions
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES 
('1.0.0', 'Complete consolidated schema with all features') 
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================