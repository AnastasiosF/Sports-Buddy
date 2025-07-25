import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, isValidEmail, isValidPassword, isValidUsername, sanitizeUsername, STORAGE_KEYS } from '../types';
import { api } from '../utils/api';

interface User {
  id: string;
  email: string;
}

interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

interface AuthContextType {
  session: AuthSession | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  const loadStoredSession = async () => {
    try {
      const storedSession = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (storedSession) {
        const sessionData: AuthSession = JSON.parse(storedSession);
        
        // Check if token is expired
        if (sessionData.expires_at > Date.now()) {
          setSession(sessionData);
          setUser(sessionData.user);
          await fetchProfile(sessionData.user.id);
        } else {
          // Try to refresh token
          const refreshed = await refreshTokenWithData(sessionData.refresh_token);
          if (!refreshed) {
            await clearSession();
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored session:', error);
    } finally {
      setLoading(false);
    }
  };

  const storeSession = async (sessionData: AuthSession) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
      setSession(sessionData);
      setUser(sessionData.user);
    } catch (error) {
      console.error('Error storing session:', error);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const profileData = await api.get<Profile>(`/api/profiles/${userId}`);
      setProfile(profileData);
      
      // Store profile for offline access
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profileData));
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Try to load cached profile
      try {
        const cachedProfile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
        }
      } catch (cacheError) {
        console.error('Error loading cached profile:', cacheError);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    // Validate input
    if (!isValidEmail(email)) {
      return { error: 'Invalid email format' };
    }

    try {
      const response = await api.post<{
        message: string;
        user: User;
        session: {
          access_token: string;
          refresh_token: string;
          expires_at: number;
        };
      }>('/api/auth/signin', { email, password });

      const sessionData: AuthSession = {
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token,
        expires_at: response.session.expires_at,
        user: response.user,
      };

      await storeSession(sessionData);
      await fetchProfile(response.user.id);

      return {};
    } catch (error: any) {
      return { error: error.message || 'Login failed' };
    }
  };

  const signUp = async (email: string, password: string, username: string, fullName?: string) => {
    // Validate input
    if (!isValidEmail(email)) {
      return { error: 'Invalid email format' };
    }

    if (!isValidPassword(password)) {
      return { error: 'Password must be at least 6 characters' };
    }

    if (!isValidUsername(username)) {
      return { error: 'Username must be 3-50 characters, alphanumeric and underscores only' };
    }

    const sanitizedUsername = sanitizeUsername(username);

    try {
      await api.post('/api/auth/signup', {
        email,
        password,
        username: sanitizedUsername,
        full_name: fullName,
      });

      return {};
    } catch (error: any) {
      return { error: error.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    try {
      await api.post('/api/auth/signout');
    } catch (error) {
      console.error('Error signing out from server:', error);
    } finally {
      await clearSession();
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { error: 'No user logged in' };
    }

    try {
      await api.put(`/api/profiles/${user.id}`, updates);
      await fetchProfile(user.id);
      return {};
    } catch (error: any) {
      return { error: error.message || 'Profile update failed' };
    }
  };

  const refreshTokenWithData = async (refreshToken: string): Promise<boolean> => {
    try {
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.45:3000';
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const sessionData: AuthSession = {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: data.user,
      };

      await storeSession(sessionData);
      await fetchProfile(data.user.id);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    if (!session?.refresh_token) {
      return false;
    }
    return refreshTokenWithData(session.refresh_token);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};