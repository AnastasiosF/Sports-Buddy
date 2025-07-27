import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LocationProvider } from '../contexts/LocationContext';
import { TabNavigator } from './TabNavigator';
import { ProfileSetupScreen } from '../screens/profile/ProfileSetupScreen';
import { SportsSelectionScreen } from '../screens/profile/SportsSelectionScreen';
import { CreateMatchScreen } from '../screens/CreateMatchScreen';
import { UserSearchScreen } from '../screens/UserSearchScreen';
import { MatchSearchScreen } from '../screens/MatchSearchScreen';
import { MatchDetailsScreen } from '../screens/MatchDetailsScreen';
import { useThemeColors } from '../hooks/useThemeColors';

export type MainStackParamList = {
  Tabs: undefined;
  Profile: { userId?: string };
  MatchDetails: { matchId: string };
  Chat: { matchId: string };
  Settings: undefined;
  ProfileSetup: undefined;
  SportsSelection: undefined;
  CreateMatch: undefined;
  UserSearch: { matchId?: string; sport_id?: string };
  MatchSearch: undefined;
  Home: undefined;
  Friends: undefined;
  Matches: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export const MainStack: React.FC = () => {
  // Navigation theme is now handled by NavigationContainer
  // We can still use colors for specific customizations if needed
  const colors = useThemeColors();
  
  return (
    <LocationProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Tabs" 
          component={TabNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ProfileSetup"
          component={ProfileSetupScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SportsSelection"
          component={SportsSelectionScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CreateMatch"
          component={CreateMatchScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="UserSearch"
          component={UserSearchScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MatchSearch"
          component={MatchSearchScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MatchDetails"
          component={MatchDetailsScreen}
          options={{
            title: 'Match Details',
            headerShown: true,
          }}
        />
        {/* Additional screens will be added here */}
      </Stack.Navigator>
    </LocationProvider>
  );
};