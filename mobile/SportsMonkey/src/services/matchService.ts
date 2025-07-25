import { api } from '../utils/api';
import { Match, Location } from '../types';

export interface CreateMatchRequest {
  sport_id: string;
  title: string;
  description?: string;
  location: Location;
  location_name: string;
  scheduled_at: string;
  duration?: number;
  max_participants?: number;
  skill_level_required?: 'any' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface GetMatchesParams {
  location?: string; // "lat,lng" format
  radius?: number;
  sport_id?: string;
  skill_level?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export const matchService = {
  // Get matches with optional filtering
  getMatches: async (params: GetMatchesParams = {}): Promise<Match[]> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const response = await api.get<{ matches: Match[] }>(`/api/matches?${queryParams.toString()}`);
    return response.matches;
  },

  // Get specific match
  getMatch: async (matchId: string): Promise<Match> => {
    return api.get<Match>(`/api/matches/${matchId}`);
  },

  // Create new match
  createMatch: async (matchData: CreateMatchRequest): Promise<Match> => {
    return api.post<Match>('/api/matches', matchData);
  },

  // Update match
  updateMatch: async (matchId: string, updates: Partial<CreateMatchRequest>): Promise<Match> => {
    return api.put<Match>(`/api/matches/${matchId}`, updates);
  },

  // Join a match
  joinMatch: async (matchId: string): Promise<void> => {
    return api.post<void>(`/api/matches/${matchId}/join`);
  },

  // Leave a match
  leaveMatch: async (matchId: string): Promise<void> => {
    return api.post<void>(`/api/matches/${matchId}/leave`);
  },

  // Get user's matches (created and participated)
  getUserMatches: async (): Promise<{ created: Match[], participated: Match[] }> => {
    return api.get<{ created: Match[], participated: Match[] }>('/api/matches/user');
  },
};