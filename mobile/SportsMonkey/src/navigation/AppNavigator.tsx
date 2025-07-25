import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { AuthStack } from './AuthStack';
import { MainStack } from './MainStack';
import { LoadingScreen } from '../screens/auth/LoadingScreen';

export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();
  const { navigationTheme } = useTheme();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};