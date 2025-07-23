import { api } from '../utils/api';
import { Profile } from '../types';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface SignInResponse {
  message: string;
  user: AuthUser;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface SignUpResponse {
  message: string;
  user: AuthUser;
}

export const authService = {
  // Sign in user
  signIn: async (email: string, password: string): Promise<SignInResponse> => {
    return api.post<SignInResponse>('/api/auth/signin', { email, password });
  },

  // Sign up user
  signUp: async (email: string, password: string, username: string, full_name?: string): Promise<SignUpResponse> => {
    return api.post<SignUpResponse>('/api/auth/signup', {
      email,
      password,
      username,
      full_name,
    });
  },

  // Sign out user
  signOut: async (): Promise<void> => {
    return api.post<void>('/api/auth/signout');
  },

  // Refresh token
  refreshToken: async (refresh_token: string): Promise<SignInResponse> => {
    return api.post<SignInResponse>('/api/auth/refresh', { refresh_token });
  },
};