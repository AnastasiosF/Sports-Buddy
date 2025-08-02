import React, { useState } from 'react';
import { SpeedDial } from '@rneui/themed';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/MainStack';
import { useAppTheme } from '../hooks/useThemeColors';

interface FABProps {
  actions?: Array<{
    icon: { name: string; color?: string };
    title: string;
    onPress: () => void;
  }>;
}

export const FAB: React.FC<FABProps> = ({ actions }) => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const theme = useAppTheme();
  const [isOpen, setIsOpen] = useState(false);

  const defaultActions = [
    {
      icon: { name: 'person-outline', color: 'white' },
      title: 'Profile',
      onPress: () => {
        navigation.navigate('Profile', {});
        setIsOpen(false);
      },
    },
    {
      icon: { name: 'basketball-outline', color: 'white' },
      title: 'Create Match',
      onPress: () => {
        navigation.navigate('CreateMatch');
        setIsOpen(false);
      },
    },
    {
      icon: { name: 'search-outline', color: 'white' },
      title: 'Search Matches',
      onPress: () => {
        navigation.navigate('MatchSearch');
        setIsOpen(false);
      },
    },
  ];

  const speedDialActions = actions || defaultActions;

  return (
    <SpeedDial
      isOpen={isOpen}
      icon={{ name: 'add', color: 'white' }}
      openIcon={{ name: 'close', color: 'white' }}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      buttonStyle={{
        backgroundColor: theme.colors.primary,
      }}
      overlayColor="rgba(0,0,0,0.5)"
    >
      {speedDialActions.map((action, index) => (
        <SpeedDial.Action
          key={index}
          icon={action.icon}
          title={action.title}
          onPress={action.onPress}
          buttonStyle={{
            backgroundColor: theme.colors.primary,
          }}
          titleStyle={{
            color: theme.colors.text,
          }}
        />
      ))}
    </SpeedDial>
  );
};

