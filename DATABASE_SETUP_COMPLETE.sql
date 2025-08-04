-- ============================================================================
-- SPORTS BUDDY APP - COMPLETE DATABASE SETUP
-- ============================================================================
-- This file contains the complete database schema and all functions
-- Run this SQL in your Supabase SQL Editor to set up the entire database
-- Last updated: 2025-08-04
-- Version: 2.0.0
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Sports table - defines available sports activities
CREATE TABLE IF NOT EXISTS sports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  min_players INTEGER DEFAULT 1,
  max_players INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
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
CREATE TABLE IF NOT EXISTS user_sports (
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
CREATE TABLE IF NOT EXISTS matches (
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
CREATE TABLE IF NOT EXISTS match_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Messages between users in match context
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User connections/friendships
CREATE TABLE IF NOT EXISTS user_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK(user_id != friend_id)
);

-- Reviews/ratings for players
CREATE TABLE IF NOT EXISTS user_reviews (
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
-- UTILITY FUNCTIONS
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

-- ============================================================================
-- FRIEND SYSTEM FUNCTIONS
-- ============================================================================

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

-- ============================================================================
-- FRIEND SUGGESTIONS FUNCTION
-- ============================================================================

-- Drop any existing friend suggestions functions
DROP FUNCTION IF EXISTS get_friend_suggestions(UUID, GEOGRAPHY(POINT, 4326), INTEGER, UUID[]);
DROP FUNCTION IF EXISTS get_friend_suggestions_v2(UUID, GEOGRAPHY(POINT, 4326), INTEGER, UUID[]);

-- Enhanced friend suggestions function with location, sports, and social matching
CREATE OR REPLACE FUNCTION get_friend_suggestions_v2(
  current_user_id UUID,
  user_location GEOGRAPHY(POINT, 4326),
  search_radius INTEGER DEFAULT 10000, -- meters
  exclude_user_ids UUID[] DEFAULT '{}'::UUID[]
)
RETURNS TABLE (
  id UUID,
  username VARCHAR(50),
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  skill_level VARCHAR(20),
  location_name VARCHAR(255),
  distance_meters DOUBLE PRECISION,
  mutual_sports_count INTEGER,
  mutual_friends_count INTEGER,
  suggestion_score DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  WITH user_sports_cte AS (
    -- Get current user's sports
    SELECT us.sport_id, us.skill_level as user_skill_level
    FROM user_sports us
    WHERE us.user_id = current_user_id
  ),
  user_friends_cte AS (
    -- Get current user's friends
    SELECT 
      CASE 
        WHEN uc.user_id = current_user_id THEN uc.friend_id
        ELSE uc.user_id
      END as friend_id
    FROM user_connections uc
    WHERE (uc.user_id = current_user_id OR uc.friend_id = current_user_id)
      AND uc.status = 'accepted'
  ),
  nearby_users AS (
    -- Find users within the specified radius
    SELECT 
      p.id,
      p.username,
      p.full_name,
      p.avatar_url,
      p.bio,
      p.skill_level,
      p.location_name,
      ST_Distance(p.location, user_location) as distance_meters
    FROM profiles p
    WHERE p.location IS NOT NULL
      AND p.id != current_user_id
      AND NOT (p.id = ANY(exclude_user_ids))
      AND ST_DWithin(p.location, user_location, search_radius)
  ),
  suggestions_with_scores AS (
    SELECT 
      nu.*,
      -- Count mutual sports interests
      COALESCE((
        SELECT COUNT(*)
        FROM user_sports candidate_sports
        JOIN user_sports_cte current_user_sports ON current_user_sports.sport_id = candidate_sports.sport_id
        WHERE candidate_sports.user_id = nu.id
      ), 0) as mutual_sports_count,
      
      -- Count mutual friends
      COALESCE((
        SELECT COUNT(*)
        FROM user_connections uc
        JOIN user_friends_cte uf ON (
          (uc.user_id = nu.id AND uc.friend_id = uf.friend_id) OR
          (uc.friend_id = nu.id AND uc.user_id = uf.friend_id)
        )
        WHERE uc.status = 'accepted'
      ), 0) as mutual_friends_count,
      
      -- Calculate suggestion score (higher is better)
      (
        -- Distance score (closer = higher score, max 50 points)
        GREATEST(0::DOUBLE PRECISION, 50::DOUBLE PRECISION - (ST_Distance(nu.location, user_location) / 200::DOUBLE PRECISION)) +
        
        -- Mutual sports score (each mutual sport = 30 points)
        COALESCE((
          SELECT COUNT(*) * 30
          FROM user_sports candidate_sports
          JOIN user_sports_cte current_user_sports ON current_user_sports.sport_id = candidate_sports.sport_id
          WHERE candidate_sports.user_id = nu.id
        ), 0) +
        
        -- Mutual friends score (each mutual friend = 20 points)
        COALESCE((
          SELECT COUNT(*) * 20
          FROM user_connections uc
          JOIN user_friends_cte uf ON (
            (uc.user_id = nu.id AND uc.friend_id = uf.friend_id) OR
            (uc.friend_id = nu.id AND uc.user_id = uf.friend_id)
          )
          WHERE uc.status = 'accepted'
        ), 0) +
        
        -- Skill level match bonus (same skill level = 10 points)
        CASE 
          WHEN nu.skill_level = (SELECT p2.skill_level FROM profiles p2 WHERE p2.id = current_user_id) 
          THEN 10::DOUBLE PRECISION
          ELSE 0::DOUBLE PRECISION
        END
      ) as suggestion_score
      
    FROM nearby_users nu
  )
  SELECT 
    sws.id,
    sws.username,
    sws.full_name,
    sws.avatar_url,
    sws.bio,
    sws.skill_level,
    sws.location_name,
    sws.distance_meters,
    sws.mutual_sports_count,
    sws.mutual_friends_count,
    sws.suggestion_score
  FROM suggestions_with_scores sws
  WHERE sws.suggestion_score > 10 -- Only return suggestions with meaningful connections
  ORDER BY sws.suggestion_score DESC, sws.distance_meters ASC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ANALYTICS FUNCTIONS
-- ============================================================================

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
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to automatically update updated_at on matches
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger to automatically update updated_at on user_sports
DROP TRIGGER IF EXISTS update_user_sports_updated_at ON user_sports;
CREATE TRIGGER update_user_sports_updated_at 
    BEFORE UPDATE ON user_sports
    FOR EACH ROW EXECUTE PROCEDURE update_user_sports_updated_at();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Spatial indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_matches_location ON matches USING GIST (location);

-- Temporal indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_matches_scheduled_at ON matches (scheduled_at);

-- Foreign key indexes for joins
CREATE INDEX IF NOT EXISTS idx_matches_sport_id ON matches (sport_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status);
CREATE INDEX IF NOT EXISTS idx_user_sports_user_id ON user_sports (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sports_sport_id ON user_sports (sport_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_match_id ON match_participants (match_id);
CREATE INDEX IF NOT EXISTS idx_match_participants_user_id ON match_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages (match_id);

-- User connections indexes for friend system
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_friend_id ON user_connections (friend_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections (status);
CREATE INDEX IF NOT EXISTS idx_user_connections_created_at ON user_connections (created_at);

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_user_connections_status_users ON user_connections(status, user_id, friend_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_pending_requests ON user_connections(friend_id, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_user_connections_friends ON user_connections(user_id, friend_id, status) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_user_sports_user_preferred ON user_sports (user_id, preferred) WHERE preferred = true;
CREATE INDEX IF NOT EXISTS idx_user_sports_skill_level ON user_sports (skill_level);

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

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "sports_select_policy" ON sports;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "user_sports_select_policy" ON user_sports;
DROP POLICY IF EXISTS "user_sports_insert_policy" ON user_sports;
DROP POLICY IF EXISTS "user_sports_update_policy" ON user_sports;
DROP POLICY IF EXISTS "user_sports_delete_policy" ON user_sports;
DROP POLICY IF EXISTS "Users can view all matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Match creators can update own matches" ON matches;
DROP POLICY IF EXISTS "Users can view match participants" ON match_participants;
DROP POLICY IF EXISTS "Users can join matches or be invited by creators" ON match_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON match_participants;
DROP POLICY IF EXISTS "Participants can view match messages" ON messages;
DROP POLICY IF EXISTS "Participants can send messages" ON messages;
DROP POLICY IF EXISTS "user_connections_select_own" ON user_connections;
DROP POLICY IF EXISTS "user_connections_insert_own" ON user_connections;
DROP POLICY IF EXISTS "user_connections_update_addressee" ON user_connections;
DROP POLICY IF EXISTS "user_connections_delete_own" ON user_connections;
DROP POLICY IF EXISTS "Users can view all reviews" ON user_reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON user_reviews;
DROP POLICY IF EXISTS "Reviewers can update own reviews" ON user_reviews;

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
GRANT EXECUTE ON FUNCTION get_friend_suggestions_v2(UUID, GEOGRAPHY(POINT, 4326), INTEGER, UUID[]) TO authenticated;
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
-- SCHEMA VERSION INFO
-- ============================================================================

-- Create a table to track schema versions
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_version (version, description) VALUES 
('2.0.0', 'Complete consolidated schema with friend suggestions function v2') 
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- END OF DATABASE SETUP
-- ============================================================================