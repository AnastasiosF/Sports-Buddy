import { Profile, Sport, Match, MatchParticipant, UserSport, Message, UserConnection, UserReview } from './types';

// API Request/Response types

// Authentication
export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
  full_name?: string;
}

export interface SignUpResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  needs_profile_setup?: boolean;
}

export interface SignOutResponse {
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
  type: string;
}

export interface VerifyEmailResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}

export interface ProfileSetupRequest {
  full_name?: string;
  bio?: string;
  age?: number;
  skill_level?: Profile['skill_level'];
  location?: Profile['location'];
  location_name?: string;
  preferred_sports?: string[]; // array of sport IDs
}

export interface ProfileSetupResponse {
  message: string;
  profile: Profile;
}

// Friends API types
export interface SendFriendRequestRequest {
  friend_id: string;
}

export interface SendFriendRequestResponse {
  message: string;
  connection: UserConnection;
}

export interface SearchUsersRequest {
  query: string;
}

export interface UserSearchResult extends Profile {
  relationship_status: 'none' | 'friends' | 'request_sent' | 'request_received';
  connection_id?: string;
}

export interface SearchUsersResponse {
  users: UserSearchResult[];
}

export interface GetFriendsResponse {
  friends: {
    connection_id: string;
    friend: Profile;
    created_at: string;
  }[];
}

export interface GetPendingRequestsResponse {
  requests: {
    id: string;
    created_at: string;
    user: Profile;
  }[];
}

export interface AcceptFriendRequestResponse {
  message: string;
  connection: UserConnection;
}

// Profile endpoints
export interface UpdateProfileRequest {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  skill_level?: Profile['skill_level'];
  location?: Profile['location'];
  location_name?: string;
}

export interface SearchProfilesRequest {
  location?: string; // "lng,lat" format
  radius?: number; // meters
  sport_id?: string;
  skill_level?: Profile['skill_level'];
}

export interface AddUserSportRequest {
  user_id: string;
  sport_id: string;
  skill_level?: UserSport['skill_level'];
  preferred?: boolean;
}

// Match endpoints
export interface CreateMatchRequest {
  created_by: string;
  sport_id: string;
  title: string;
  description?: string;
  location: Profile['location'];
  location_name: string;
  scheduled_at: string;
  duration?: number;
  max_participants?: number;
  skill_level_required?: Match['skill_level_required'];
}

export interface UpdateMatchRequest {
  title?: string;
  description?: string;
  location?: Profile['location'];
  location_name?: string;
  scheduled_at?: string;
  duration?: number;
  max_participants?: number;
  skill_level_required?: Match['skill_level_required'];
  status?: Match['status'];
}

export interface JoinMatchRequest {
  user_id: string;
}

export interface LeaveMatchRequest {
  user_id: string;
}

export interface GetMatchesRequest {
  location?: string; // "lng,lat" format
  radius?: number; // meters
  sport_id?: string;
  skill_level?: Match['skill_level_required'];
  status?: Match['status'];
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Error response
export interface ApiError {
  error: string;
  details?: string;
}

// Success response with message only
export interface ApiSuccess {
  message: string;
}