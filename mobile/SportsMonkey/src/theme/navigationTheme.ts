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
    primary: '#2196F3',
    background: '#FFFFFF',
    card: '#FFFFFF',
    text: '#333333',
    border: '#E0E0E0',
    notification: '#2196F3',
    // Additional theme colors that match our RNE theme
    surface: '#F5F5F5',
    textSecondary: '#666666',
    textDisabled: '#999999',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    secondary: '#FF9800',
  },
};

export const darkNavigationTheme: CombinedTheme = {
  dark: true,
  colors: {
    // React Navigation required colors
    primary: '#2196F3',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#333333',
    notification: '#2196F3',
    // Additional theme colors that match our RNE theme
    surface: '#1E1E1E',
    textSecondary: '#CCCCCC',
    textDisabled: '#666666',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    secondary: '#FF9800',
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