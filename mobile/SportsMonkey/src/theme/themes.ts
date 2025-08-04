import { createTheme } from '@rneui/themed';

const baseTheme = {
  colors: {
    primary: '#2563EB',     // Vibrant blue
    secondary: '#1E40AF',   // Deeper blue
    success: '#059669',     // Emerald green
    warning: '#D97706',     // Orange (complementary to blue)
    error: '#DC2626',       // Modern red
    info: '#0EA5E9',        // Sky blue
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 20,
  },
};

export const lightTheme = createTheme({
  lightColors: {
    primary: baseTheme.colors.primary,
    secondary: baseTheme.colors.secondary,
    success: baseTheme.colors.success,
    warning: baseTheme.colors.warning,
    error: baseTheme.colors.error,
    // Use the built-in RNE color names
    background: '#F8FAFC',  // Blue-tinted white
    disabled: '#94A3B8',    // Blue-gray
    divider: '#E2E8F0',     // Light blue-gray border
    grey0: '#1E293B',       // Dark blue-gray
    grey1: '#64748B',       // Medium blue-gray  
    grey2: '#94A3B8',       // Light blue-gray
    grey3: '#E2E8F0',       // Very light blue-gray
    grey4: '#F8FAFC',       // Blue-tinted off-white
    grey5: '#FFFFFF',       // Pure white
  },
  components: {
    Button: {
      buttonStyle: {
        borderRadius: baseTheme.borderRadius.xl,
        paddingVertical: 12,
      },
      titleStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    Input: {
      inputContainerStyle: {
        borderBottomWidth: 1,
        paddingHorizontal: 0,
      },
      inputStyle: {
        fontSize: 16,
        paddingLeft: 10,
      },
    },
    Card: {
      containerStyle: {
        borderRadius: baseTheme.borderRadius.lg,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    },
  },
});

export const darkTheme = createTheme({
  darkColors: {
    primary: '#60A5FA',     // Lighter blue for dark mode
    secondary: '#3B82F6',   // Medium blue
    success: baseTheme.colors.success,
    warning: baseTheme.colors.warning,
    error: baseTheme.colors.error,
    // Use the built-in RNE color names
    background: '#0F172A',  // Dark blue-gray
    disabled: '#64748B',    // Blue-gray-500
    divider: '#334155',     // Blue-gray-700
    grey0: '#F1F5F9',       // Light blue-gray
    grey1: '#CBD5E1',       // Blue-gray-300
    grey2: '#94A3B8',       // Blue-gray-400
    grey3: '#64748B',       // Blue-gray-500
    grey4: '#1E293B',       // Blue-gray-800
    grey5: '#0F172A',       // Dark blue-gray
  },
  components: {
    Button: {
      buttonStyle: {
        borderRadius: baseTheme.borderRadius.xl,
        paddingVertical: 12,
      },
      titleStyle: {
        fontSize: 16,
        fontWeight: 'bold',
      },
    },
    Input: {
      inputContainerStyle: {
        borderBottomWidth: 1,
        paddingHorizontal: 0,
      },
      inputStyle: {
        fontSize: 16,
        paddingLeft: 10,
      },
    },
    Card: {
      containerStyle: {
        borderRadius: baseTheme.borderRadius.lg,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    },
  },
});