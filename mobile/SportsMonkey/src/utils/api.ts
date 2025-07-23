import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../types';

// API base URL - you should set this in your environment
// Use 10.0.2.2 for Android emulator, or your local IP for physical devices
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.45:3000';

// Helper function to get authenticated headers
export const getAuthHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const storedSession = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (storedSession) {
      const sessionData = JSON.parse(storedSession);
      if (sessionData.access_token) {
        headers.Authorization = `Bearer ${sessionData.access_token}`;
      }
    }
  } catch (error) {
    console.error('Error getting auth headers:', error);
  }

  return headers;
};

// Token refresh function
const refreshToken = async (): Promise<boolean> => {
  try {
    const storedSession = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
    if (!storedSession) return false;

    const sessionData = JSON.parse(storedSession);
    if (!sessionData.refresh_token) return false;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: sessionData.refresh_token }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    const newSessionData = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: data.user,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(newSessionData));
    return true;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Generic API request function with auto token refresh
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getAuthHeaders();

  const config: RequestInit = {
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Handle token expiration
    if (response.status === 401 && retryCount === 0) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        return apiRequest(endpoint, options, retryCount + 1);
      } else {
        // Redirect to login by clearing session
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
        throw new Error('Authentication expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return {} as T; // For responses without JSON content
    }
  } catch (error: any) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
};

// API helper functions
export const api = {
  get: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};