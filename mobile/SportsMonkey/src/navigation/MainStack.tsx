import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LocationProvider } from '../contexts/LocationContext';
import { TabNavigator } from './TabNavigator';
import { ProfileSetupScreen } from '../screens/profile/ProfileSetupScreen';
import { SportsSelectionScreen } from '../screens/profile/SportsSelectionScreen';

export type MainStackParamList = {
  Tabs: undefined;
  Profile: { userId: string };
  MatchDetails: { matchId: string };
  Chat: { matchId: string };
  Settings: undefined;
  ProfileSetup: undefined;
  SportsSelection: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export const MainStack: React.FC = () => {
  return (
    <LocationProvider>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
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
        {/* Additional screens will be added here */}
      </Stack.Navigator>
    </LocationProvider>
  );
};