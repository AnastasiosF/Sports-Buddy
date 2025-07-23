import { api } from '../utils/api';
import { Profile, UserSport } from '../types';

export interface SearchProfilesParams {
  location?: string; // "lat,lng" format
  radius?: number;
  sport_id?: string;
  skill_level?: string;
}

export const profileService = {
  // Get user profile
  getProfile: async (userId: string): Promise<Profile> => {
    return api.get<Profile>(`/api/profiles/${userId}`);
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    return api.put<Profile>(`/api/profiles/${userId}`, updates);
  },

  // Search profiles
  searchProfiles: async (params: SearchProfilesParams): Promise<Profile[]> => {
    const queryParams = new URLSearchParams();
    
    if (params.location) queryParams.append('location', params.location);
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.sport_id) queryParams.append('sport_id', params.sport_id);
    if (params.skill_level) queryParams.append('skill_level', params.skill_level);

    return api.get<Profile[]>(`/api/profiles/search?${queryParams.toString()}`);
  },

  // Add sport to user profile
  addUserSport: async (sport_id: string, skill_level?: string, preferred?: boolean): Promise<UserSport> => {
    return api.post<UserSport>('/api/profiles/sports', {
      sport_id,
      skill_level,
      preferred,
    });
  },

  // Remove sport from user profile
  removeUserSport: async (userId: string, sportId: string): Promise<void> => {
    return api.delete<void>(`/api/profiles/${userId}/sports/${sportId}`);
  },
};