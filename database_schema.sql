-- Sports Buddy App Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Sports table
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

-- User sports preferences
CREATE TABLE user_sports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_id UUID REFERENCES sports(id) ON DELETE CASCADE,
  skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  preferred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

-- Match participants
CREATE TABLE match_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')) DEFAULT 'pending',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Messages between users
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
('Golf', 'Sport played with clubs and balls', 1, 4);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User sports policies
CREATE POLICY "Users can view own sports" ON user_sports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own sports" ON user_sports FOR ALL USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Users can view all matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Users can create matches" ON matches FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Match creators can update own matches" ON matches FOR UPDATE USING (auth.uid() = created_by);

-- Match participants policies
CREATE POLICY "Users can view match participants" ON match_participants FOR SELECT USING (true);
CREATE POLICY "Users can join matches" ON match_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
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
CREATE POLICY "Users can view own connections" ON user_connections FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own connections" ON user_connections FOR ALL 
USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Users can view all reviews" ON user_reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON user_reviews FOR INSERT 
WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can update own reviews" ON user_reviews FOR UPDATE 
USING (auth.uid() = reviewer_id);

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_profiles_location ON profiles USING GIST (location);
CREATE INDEX idx_matches_location ON matches USING GIST (location);
CREATE INDEX idx_matches_scheduled_at ON matches (scheduled_at);
CREATE INDEX idx_matches_sport_id ON matches (sport_id);
CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_user_sports_user_id ON user_sports (user_id);
CREATE INDEX idx_match_participants_match_id ON match_participants (match_id);
CREATE INDEX idx_match_participants_user_id ON match_participants (user_id);
CREATE INDEX idx_messages_match_id ON messages (match_id);
CREATE INDEX idx_user_connections_user_id ON user_connections (user_id);
CREATE INDEX idx_user_connections_friend_id ON user_connections (friend_id);