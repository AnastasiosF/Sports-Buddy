import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';

export interface CombinedTheme {
  dark: boolean;
  colors: {
    // React Navigation colors
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    // Additional theme colors
    surface: string;
    textSecondary: string;
    textDisabled: string;
    success: string;
    warning: string;
    error: string;
    secondary: string;
  };
}

export const lightNavigationTheme: CombinedTheme = {
  dark: false,
  colors: {
    // React Navigation required colors
    primary: '#2563EB',     // Vibrant blue
    background: '#F8FAFC',  // Blue-tinted white
    card: '#FFFFFF',        // Pure white
    text: '#1E293B',        // Dark blue-gray
    border: '#E2E8F0',      // Light blue-gray
    notification: '#0EA5E9', // Sky blue
    // Additional theme colors that match our RNE theme
    surface: '#FFFFFF',     // Pure white surface
    textSecondary: '#64748B', // Medium blue-gray
    textDisabled: '#94A3B8', // Light blue-gray
    success: '#059669',     // Emerald green
    warning: '#D97706',     // Orange (complementary to blue)
    error: '#DC2626',       // Modern red
    secondary: '#1E40AF',   // Deeper blue
  },
};

export const darkNavigationTheme: CombinedTheme = {
  dark: true,
  colors: {
    // React Navigation required colors
    primary: '#60A5FA',     // Lighter blue for dark mode
    background: '#0F172A',  // Dark blue-gray
    card: '#1E293B',        // Blue-gray-800
    text: '#F1F5F9',        // Light blue-gray
    border: '#334155',      // Blue-gray-700
    notification: '#0EA5E9', // Sky blue
    // Additional theme colors that match our RNE theme
    surface: '#1E293B',     // Blue-gray-800 surface
    textSecondary: '#CBD5E1', // Blue-gray-300
    textDisabled: '#64748B', // Blue-gray-500
    success: '#059669',     // Emerald green
    warning: '#D97706',     // Orange (complementary to blue)
    error: '#DC2626',       // Modern red
    secondary: '#3B82F6',   // Medium blue
  },
};

// Helper function to convert our combined theme to React Navigation theme
export const toNavigationTheme = (combinedTheme: CombinedTheme): Theme => ({
  dark: combinedTheme.dark,
  colors: {
    primary: combinedTheme.colors.primary,
    background: combinedTheme.colors.background,
    card: combinedTheme.colors.card,
    text: combinedTheme.colors.text,
    border: combinedTheme.colors.border,
    notification: combinedTheme.colors.notification,
  },
  fonts: DefaultTheme.fonts, // Use default fonts
});