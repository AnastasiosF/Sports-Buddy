import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Button } from '@rneui/themed';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from './MainStack';
import { useAuth } from '../contexts/AuthContext';
import { NearbyPeopleScreen } from '../screens/NearbyPeopleScreen';
import { NearbyMatchesScreen } from '../screens/NearbyMatchesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MainDashboard } from '../screens/MainDashboardScreen';
import { Ionicons } from '@expo/vector-icons';
import { FAB } from '../components/FAB';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';

export type TabParamList = {
  Home: undefined;
  Friends: undefined;
  Matches: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Header component for consistent header across tabs
interface TabHeaderProps {
  title?: string;
}

const TabHeader: React.FC<TabHeaderProps> = ({ title }) => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { user } = useAuth();
  const colors = useThemeColors();

  return (
    <View style={{
      backgroundColor: colors.primary,
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
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={{
          width: 32,
          height: 32,
          backgroundColor: 'white',
          borderRadius: 16,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Ionicons name="basketball" size={20} color={colors.primary} />
        </View>
        {title && (
          <Button
            title={title}
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
            disabled
          />
        )}
      </View>
      <Button
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
        onPress={() => {
          navigation.navigate('Profile', {});
        }}
        icon={<Ionicons name="person" size={16} color="white" />}
      />
    </View>
  );
};


// Main Dashboard Screen combining Friends and Nearby Matches
const MainDashboardScreen: React.FC = () => {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader />
      <MainDashboard />
      <FAB />
    </View>
  );
};

// People Screen with header and FAB
const PeopleScreenWithHeader: React.FC = () => {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader title="Friends" />
      <NearbyPeopleScreen />
      <FAB />
    </View>
  );
};

// Matches Screen with header and FAB
const MatchesScreenWithHeader: React.FC = () => {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader title="Matches" />
      <NearbyMatchesScreen />
      <FAB />
    </View>
  );
};

// Profile Screen with header
const ProfileScreenWithHeader: React.FC = () => {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader title="Profile" />
      <ProfileScreen />
      <FAB />
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Friends') {
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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
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
        name="Home"
        component={MainDashboardScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Friends"
        component={PeopleScreenWithHeader}
        options={{
          tabBarLabel: 'Friends',
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
