// App-wide constants

// Default values
export const DEFAULT_MATCH_DURATION = 60; // minutes
export const DEFAULT_MAX_PARTICIPANTS = 2;
export const DEFAULT_SEARCH_RADIUS = 10000; // meters (10km)

// Limits
export const MAX_BIO_LENGTH = 500;
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 1000;
export const MAX_MESSAGE_LENGTH = 1000;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;
export const MIN_PASSWORD_LENGTH = 6;
export const MIN_AGE = 13;
export const MAX_AGE = 120;
export const MIN_MATCH_DURATION = 15; // minutes
export const MAX_MATCH_DURATION = 480; // minutes (8 hours)
export const MIN_PARTICIPANTS = 1;
export const MAX_PARTICIPANTS = 50;
export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MAX_SEARCH_RESULTS = 50;

// Time constants
export const MILLISECONDS_IN_HOUR = 60 * 60 * 1000;
export const MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR;
export const MILLISECONDS_IN_WEEK = 7 * MILLISECONDS_IN_DAY;

// Geographic constants
export const EARTH_RADIUS_KM = 6371;
export const DEGREES_TO_RADIANS = Math.PI / 180;

// Default sports list (matches database initial data)
export const DEFAULT_SPORTS = [
  { name: 'Tennis', min_players: 2, max_players: 4 },
  { name: 'Basketball', min_players: 2, max_players: 10 },
  { name: 'Football/Soccer', min_players: 2, max_players: 22 },
  { name: 'Volleyball', min_players: 2, max_players: 12 },
  { name: 'Badminton', min_players: 2, max_players: 4 },
  { name: 'Table Tennis', min_players: 2, max_players: 4 },
  { name: 'Running', min_players: 1, max_players: null },
  { name: 'Cycling', min_players: 1, max_players: null },
  { name: 'Swimming', min_players: 1, max_players: null },
  { name: 'Golf', min_players: 1, max_players: 4 },
] as const;

// API endpoints base paths
export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  PROFILES: '/api/profiles',
  SPORTS: '/api/sports',
  MATCHES: '/api/matches',
} as const;

// Storage keys (for AsyncStorage/localStorage)
export const STORAGE_KEYS = {
  USER_SESSION: '@sports-buddy/user-session',
  USER_PROFILE: '@sports-buddy/user-profile',
  LOCATION_PERMISSION: '@sports-buddy/location-permission',
  THEME_PREFERENCE: '@sports-buddy/theme-preference',
} as const;

// Theme colors
export const COLORS = {
  PRIMARY: '#2196F3',
  SECONDARY: '#FF9800',
  SUCCESS: '#4CAF50',
  WARNING: '#FF9800',
  ERROR: '#F44336',
  INFO: '#2196F3',
  LIGHT: '#F5F5F5',
  DARK: '#212121',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY: '#666666',
  LIGHT_GRAY: '#CCCCCC',
} as const;

// Screen names for navigation
export const SCREEN_NAMES = {
  AUTH: 'Auth',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  HOME: 'Home',
  PROFILE: 'Profile',
  MATCHES: 'Matches',
  CREATE_MATCH: 'CreateMatch',
  MATCH_DETAILS: 'MatchDetails',
  SPORTS_SELECTION: 'SportsSelection',
  SETTINGS: 'Settings',
  CHAT: 'Chat',
} as const;