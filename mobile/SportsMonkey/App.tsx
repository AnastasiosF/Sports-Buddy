import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@rneui/themed';
import { AuthProvider } from './src/contexts/AuthContext';
import { FriendsProvider } from './src/contexts/FriendsContext';
import { ThemeProvider as CustomThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <CustomThemeProvider>
        <ThemeProviderWrapper>
          <AuthProvider>
            <FriendsProvider>
              <AppNavigator />
              <StatusBar style="auto" />
            </FriendsProvider>
          </AuthProvider>
        </ThemeProviderWrapper>
      </CustomThemeProvider>
    </SafeAreaProvider>
  );
}

const ThemeProviderWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentTheme } = useTheme();
  return (
    <ThemeProvider theme={currentTheme}>
      {children}
    </ThemeProvider>
  );
};
