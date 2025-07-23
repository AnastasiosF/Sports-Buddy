import { api } from '../utils/api';
import { Profile, Match, Location } from '../types';

export interface NearbyUsersResponse {
  users: (Profile & { distance: number })[];
  count: number;
  searchParams: {
    latitude: number;
    longitude: number;
    radius: number;
    sport_id?: string;
    skill_level?: string;
  };
}

export interface NearbyMatchesResponse {
  matches: (Match & { distance: number })[];
  count: number;
  searchParams: {
    latitude: number;
    longitude: number;
    radius: number;
    sport_id?: string;
    skill_level?: string;
    date_from?: string;
    date_to?: string;
  };
}

export interface PopularAreasResponse {
  areas: {
    location_name: string;
    activity_count: number;
    avg_lng: number;
    avg_lat: number;
  }[];
  count: number;
}

export interface LocationSearchParams {
  latitude: number;
  longitude: number;
  radius?: number;
  sport_id?: string;
  skill_level?: 'any' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  date_from?: string;
  date_to?: string;
}

export const locationService = {
  // Find nearby users
  findNearbyUsers: async (params: LocationSearchParams): Promise<NearbyUsersResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', params.latitude.toString());
    queryParams.append('longitude', params.longitude.toString());
    
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.sport_id) queryParams.append('sport_id', params.sport_id);
    if (params.skill_level && params.skill_level !== 'any') {
      queryParams.append('skill_level', params.skill_level);
    }

    return api.get<NearbyUsersResponse>(`/api/location/nearby/users?${queryParams.toString()}`);
  },

  // Find nearby matches
  findNearbyMatches: async (params: LocationSearchParams): Promise<NearbyMatchesResponse> => {
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', params.latitude.toString());
    queryParams.append('longitude', params.longitude.toString());
    
    if (params.radius) queryParams.append('radius', params.radius.toString());
    if (params.sport_id) queryParams.append('sport_id', params.sport_id);
    if (params.skill_level && params.skill_level !== 'any') {
      queryParams.append('skill_level', params.skill_level);
    }
    if (params.date_from) queryParams.append('date_from', params.date_from);
    if (params.date_to) queryParams.append('date_to', params.date_to);

    return api.get<NearbyMatchesResponse>(`/api/location/nearby/matches?${queryParams.toString()}`);
  },

  // Update user's location
  updateUserLocation: async (location: Location, location_name?: string): Promise<{ message: string; profile: Profile }> => {
    return api.put<{ message: string; profile: Profile }>('/api/location/update', {
      latitude: location.latitude,
      longitude: location.longitude,
      location_name,
    });
  },

  // Get popular sports areas
  getPopularAreas: async (userLocation?: Location, radius?: number): Promise<PopularAreasResponse> => {
    const queryParams = new URLSearchParams();
    
    if (userLocation) {
      queryParams.append('latitude', userLocation.latitude.toString());
      queryParams.append('longitude', userLocation.longitude.toString());
    }
    if (radius) queryParams.append('radius', radius.toString());

    return api.get<PopularAreasResponse>(`/api/location/popular-areas?${queryParams.toString()}`);
  },
};