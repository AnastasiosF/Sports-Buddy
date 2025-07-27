import { useTheme as useThemeContext } from '../contexts/ThemeContext';

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 20,
};

const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  title: 24,
  subtitle: 18,
};

const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const useThemeColors = () => {
  const { combinedTheme } = useThemeContext();
  
  return {
    primary: combinedTheme.colors.primary,
    secondary: combinedTheme.colors.secondary,
    success: combinedTheme.colors.success,
    warning: combinedTheme.colors.warning,
    error: combinedTheme.colors.error,
    background: combinedTheme.colors.background,
    surface: combinedTheme.colors.surface,
    text: combinedTheme.colors.text,
    textSecondary: combinedTheme.colors.textSecondary,
    textDisabled: combinedTheme.colors.textDisabled,
    border: combinedTheme.colors.border,
    card: combinedTheme.colors.card,
    notification: combinedTheme.colors.notification,
  };
};

export const useAppTheme = () => {
  const { combinedTheme } = useThemeContext();
  
  return {
    colors: {
      primary: combinedTheme.colors.primary,
      secondary: combinedTheme.colors.secondary,
      success: combinedTheme.colors.success,
      warning: combinedTheme.colors.warning,
      error: combinedTheme.colors.error,
      background: combinedTheme.colors.background,
      surface: combinedTheme.colors.surface,
      text: combinedTheme.colors.text,
      textSecondary: combinedTheme.colors.textSecondary,
      textDisabled: combinedTheme.colors.textDisabled,
      border: combinedTheme.colors.border,
      card: combinedTheme.colors.card,
      notification: combinedTheme.colors.notification,
    },
    spacing,
    borderRadius,
    fontSize,
    shadows,
  };
};