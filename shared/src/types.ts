// Base types
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type MatchStatus = 'open' | 'full' | 'completed' | 'cancelled';
export type ParticipantStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';
export type ConnectionStatus = 'pending' | 'accepted' | 'blocked';
export type SkillLevelFilter = 'any' | SkillLevel;

// Location type for coordinates
export interface Location {
  longitude: number;
  latitude: number;
}

// User Profile
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  skill_level?: SkillLevel;
  location?: Location;
  location_name?: string;
  created_at: string;
  updated_at: string;
  user_sports?: UserSport[];
}

// Sport
export interface Sport {
  id: string;
  name: string;
  description?: string;
  min_players: number;
  max_players?: number;
  created_at: string;
}

// User Sports (many-to-many relationship between users and sports)
export interface UserSport {
  id: string;
  user_id: string;
  sport_id: string;
  skill_level?: SkillLevel;
  preferred: boolean;
  created_at: string;
  sport?: Sport;
}

// Match Participant
export interface MatchParticipant {
  id: string;
  match_id: string;
  user_id: string;
  status: ParticipantStatus;
  joined_at: string;
  user?: Profile;
}

// Match
export interface Match {
  id: string;
  created_by: string;
  sport_id: string;
  title: string;
  description?: string;
  location: Location;
  location_name: string;
  scheduled_at: string;
  duration: number; // minutes
  max_participants: number;
  skill_level_required: SkillLevelFilter;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
  sport?: Sport;
  creator?: Profile;
  participants?: MatchParticipant[];
}

// Message
export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

// User Connection
export interface UserConnection {
  id: string;
  user_id: string;
  friend_id: string;
  status: ConnectionStatus;
  created_at: string;
  friend?: Profile;
}

// User Review
export interface UserReview {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  match_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
  reviewer?: Profile;
  match?: Match;
}