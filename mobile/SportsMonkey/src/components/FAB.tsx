import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Text,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/MainStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../hooks/useThemeColors';

interface FABAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FABProps {
  actions?: FABAction[];
}

export const FAB: React.FC<FABProps> = ({ actions }) => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const theme = useAppTheme();
  const styles = createStyles(theme);

  const defaultActions: FABAction[] = [
    {
      icon: 'person-outline',
      label: 'Profile',
      onPress: () => {
        navigation.navigate('Profile', {});
        toggleMenu();
      },
      color: theme.colors.secondary,
    },
    {
      icon: 'basketball-outline',
      label: 'Create Match',
      onPress: () => {
        navigation.navigate('CreateMatch');
        toggleMenu();
      },
      color: theme.colors.success,
    },
    {
      icon: 'search-outline',
      label: 'Search Matches',
      onPress: () => {
        navigation.navigate('MatchSearch');
        toggleMenu();
      },
      color: theme.colors.primary,
    },
  ];

  const fabActions = actions || defaultActions;

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    
    Animated.spring(animation, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 7,
    }).start();
    
    setIsOpen(!isOpen);
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { bottom: theme.spacing.lg + insets.bottom, right: theme.spacing.lg }]}>
      {/* Action Items */}
      {fabActions.map((action, index) => (
        <Animated.View
          key={index}
          style={[
            styles.actionContainer,
            {
              opacity,
              transform: [
                { scale },
                {
                  translateY: animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -(theme.spacing.xl + theme.spacing.lg) * (index + 1)],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.actionWrapper}>
            <Text style={styles.actionLabel}>{action.label}</Text>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: action.color || theme.colors.primary },
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color={theme.colors.surface}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}

      {/* Main FAB Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons
            name="add"
            size={24}
            color={theme.colors.surface}
          />
        </Animated.View>
      </TouchableOpacity>

      {/* Backdrop */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          onPress={toggleMenu}
          activeOpacity={1}
        />
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  fab: {
    width: theme.spacing.xl + theme.spacing.lg,
    height: theme.spacing.xl + theme.spacing.lg,
    borderRadius: (theme.spacing.xl + theme.spacing.lg) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.lg,
    zIndex: 1000,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    zIndex: 999,
  },
  actionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  actionButton: {
    width: theme.spacing.xl + theme.spacing.sm,
    height: theme.spacing.xl + theme.spacing.sm,
    borderRadius: (theme.spacing.xl + theme.spacing.sm) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  actionLabel: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm + theme.spacing.xs,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.borderRadius.md + theme.borderRadius.sm,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    marginRight: theme.spacing.sm + theme.spacing.xs,
    overflow: 'hidden',
  },
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 998,
  },
});