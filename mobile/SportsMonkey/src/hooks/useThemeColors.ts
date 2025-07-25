import { useTheme } from '../contexts/ThemeContext';

export const useThemeColors = () => {
  const { combinedTheme } = useTheme();
  
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