import { api } from '../utils/api';
import { Match, Location } from '../types';

export interface CreateMatchRequest {
  sport_id: string;
  title: string;
  description?: string;
  location: [number, number]; // [longitude, latitude]
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
  search?: string; // Search query
  search_type?: string; // Search type: 'all', 'location', 'title', 'creator'
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

  // Join a match (request to join)
  joinMatch: async (matchId: string): Promise<void> => {
    try {
      return await api.post<void>(`/api/matches/${matchId}/join`);
    } catch (error: any) {
      console.error('Failed to join match:', error);
      if (error.message?.includes('Authentication expired')) {
        throw error;
      }
      if (error.message?.includes('already participating') || error.message?.includes('already joined')) {
        throw new Error('You are already participating in this match.');
      }
      if (error.message?.includes('already requested') || error.message?.includes('pending request')) {
        throw new Error('You have already requested to join this match.');
      }
      if (error.message?.includes('full')) {
        throw new Error('This match is already full.');
      }
      if (error.message?.includes('not found')) {
        throw new Error('Match not found.');
      }
      if (error.message?.includes('cancelled') || error.message?.includes('completed')) {
        throw new Error('This match is no longer available.');
      }
      throw new Error('Unable to join match. Please try again.');
    }
  },

  // Leave a match
  leaveMatch: async (matchId: string): Promise<void> => {
    return api.post<void>(`/api/matches/${matchId}/leave`);
  },

  // Get user's matches (created and participated)
  getUserMatches: async (): Promise<{ created: Match[], participated: Match[] }> => {
    return api.get<{ created: Match[], participated: Match[] }>('/api/matches/user');
  },

  // Invite user to match
  inviteToMatch: async (matchId: string, userId: string): Promise<void> => {
    try {
      return await api.post<void>(`/api/matches/${matchId}/invite`, { user_id: userId });
    } catch (error: any) {
      console.error('Failed to invite user to match:', error);
      if (error.message?.includes('Authentication expired')) {
        throw error;
      }
      if (error.message?.includes('already invited') || error.message?.includes('already participating')) {
        throw new Error('This user has already been invited or is already participating in this match.');
      }
      if (error.message?.includes('not found')) {
        throw new Error('Match or user not found.');
      }
      throw new Error('Unable to send invitation. Please try again.');
    }
  },

  // Respond to match invitation
  respondToInvitation: async (matchId: string, response: 'accept' | 'decline'): Promise<void> => {
    try {
      return await api.post<void>(`/api/matches/${matchId}/respond`, { response });
    } catch (error: any) {
      console.error('Failed to respond to invitation:', error);
      if (error.message?.includes('Authentication expired')) {
        throw error;
      }
      if (error.message?.includes('not found')) {
        throw new Error('Invitation not found or has already been processed.');
      }
      if (error.message?.includes('full')) {
        throw new Error('Match is already full.');
      }
      const action = response === 'accept' ? 'accept' : 'decline';
      throw new Error(`Unable to ${action} invitation. Please try again.`);
    }
  },

  // Get pending match invitations for current user
  getPendingInvitations: async (): Promise<any[]> => {
    try {
      return await api.get<any[]>('/api/matches/invitations/received');
    } catch (error: any) {
      console.error('Failed to get pending invitations:', error);
      // Throw the error with a user-friendly message so the context can handle it
      if (error.message?.includes('Authentication expired')) {
        throw error; // Let auth errors bubble up
      }
      throw new Error('Unable to load invitations. Please check your connection and try again.');
    }
  },

  // Get join requests for matches you created
  getJoinRequests: async (): Promise<any[]> => {
    try {
      return await api.get<any[]>('/api/matches/requests/received');
    } catch (error: any) {
      console.error('Failed to get join requests:', error);
      // Throw the error with a user-friendly message so the context can handle it
      if (error.message?.includes('Authentication expired')) {
        throw error; // Let auth errors bubble up
      }
      throw new Error('Unable to load join requests. Please check your connection and try again.');
    }
  },

  // Accept a join request
  acceptJoinRequest: async (requestId: string): Promise<void> => {
    try {
      return await api.post<void>(`/api/matches/requests/${requestId}/accept`);
    } catch (error: any) {
      console.error('Failed to accept join request:', error);
      if (error.message?.includes('Authentication expired')) {
        throw error;
      }
      throw new Error('Unable to accept join request. Please try again.');
    }
  },

  // Decline a join request
  declineJoinRequest: async (requestId: string): Promise<void> => {
    try {
      return await api.post<void>(`/api/matches/requests/${requestId}/decline`);
    } catch (error: any) {
      console.error('Failed to decline join request:', error);
      if (error.message?.includes('Authentication expired')) {
        throw error;
      }
      throw new Error('Unable to decline join request. Please try again.');
    }
  },
};