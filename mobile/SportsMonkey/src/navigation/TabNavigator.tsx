import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { NearbyPeopleScreen } from '../screens/NearbyPeopleScreen';
import { NearbyMatchesScreen } from '../screens/NearbyMatchesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import { FAB } from '../components/FAB';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabParamList = {
  People: undefined;
  Matches: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Header component for consistent header across tabs
const TabHeader: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();

  return (
    <View style={{
      backgroundColor: '#2196F3',
      paddingTop: 50,
      paddingBottom: 15,
      paddingHorizontal: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <Button
        title={user?.email || 'User'}
        type="clear"
        titleStyle={{
          color: 'white',
          fontSize: 18,
          fontWeight: 'bold',
        }}
        buttonStyle={{
          justifyContent: 'flex-start',
          paddingLeft: 0,
        }}
        onPress={() => {
          console.log('Navigate to profile');
        }}
      />
      <Button
        title="Sign Out"
        type="clear"
        titleStyle={{
          color: 'white',
          fontSize: 14,
          fontWeight: '500',
        }}
        buttonStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          paddingHorizontal: 15,
          paddingVertical: 8,
        }}
        onPress={signOut}
      />
    </View>
  );
};


// People Screen with header and FAB
const PeopleScreenWithHeader: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
    <TabHeader />
    <NearbyPeopleScreen />
    <FAB />
  </View>
);

// Matches Screen with header and FAB
const MatchesScreenWithHeader: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
    <TabHeader />
    <NearbyMatchesScreen />
    <FAB />
  </View>
);

// Profile Screen with header
const ProfileScreenWithHeader: React.FC = () => (
  <View style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
    <ProfileScreen />
    <FAB />
  </View>
);

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'People') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'basketball' : 'basketball-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="People"
        component={PeopleScreenWithHeader}
        options={{
          tabBarLabel: 'People',
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreenWithHeader}
        options={{
          tabBarLabel: 'Matches',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreenWithHeader}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};
