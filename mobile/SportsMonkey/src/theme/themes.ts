import { createTheme } from '@rneui/themed';

const baseTheme = {
  colors: {
    primary: '#2196F3',
    secondary: '#FF9800',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
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
    background: '#FFFFFF',
    disabled: '#999999',
    divider: '#E0E0E0',
    grey0: '#333333',
    grey1: '#666666',
    grey2: '#999999',
    grey3: '#E0E0E0',
    grey4: '#F5F5F5',
    grey5: '#FFFFFF',
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
    primary: baseTheme.colors.primary,
    secondary: baseTheme.colors.secondary,
    success: baseTheme.colors.success,
    warning: baseTheme.colors.warning,
    error: baseTheme.colors.error,
    // Use the built-in RNE color names
    background: '#121212',
    disabled: '#666666',
    divider: '#333333',
    grey0: '#FFFFFF',
    grey1: '#CCCCCC',
    grey2: '#999999',
    grey3: '#666666',
    grey4: '#333333',
    grey5: '#1E1E1E',
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