import { api } from '../utils/api';
import { Sport } from '../types';

export const sportsService = {
  // Get all available sports
  getAllSports: async (): Promise<Sport[]> => {
    return api.get<Sport[]>('/api/sports');
  },

  // Get specific sport
  getSport: async (sportId: string): Promise<Sport> => {
    return api.get<Sport>(`/api/sports/${sportId}`);
  },
};