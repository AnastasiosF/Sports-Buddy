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
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../hooks/useThemeColors';

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
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));
  const colors = useThemeColors();

  const defaultActions: FABAction[] = [
    {
      icon: 'basketball-outline',
      label: 'Create Match',
      onPress: () => {
        navigation.navigate('CreateMatch' as never);
        toggleMenu();
      },
      color: '#4CAF50',
    },
    {
      icon: 'search-outline',
      label: 'Search Matches',
      onPress: () => {
        navigation.navigate('MatchSearch' as never);
        toggleMenu();
      },
      color: '#2196F3',
    },
    {
      icon: 'person-add-outline',
      label: 'Profile Setup',
      onPress: () => {
        navigation.navigate('ProfileSetup' as never);
        toggleMenu();
      },
      color: '#FF9800',
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => {
        console.log('Settings');
        toggleMenu();
      },
      color: '#9C27B0',
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
    <View style={[styles.container, { bottom: 20 + insets.bottom }]}>
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
                    outputRange: [0, -(60 * (index + 1))],
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
                { backgroundColor: action.color || colors.primary },
              ]}
              onPress={action.onPress}
              activeOpacity={0.8}
            >
              <Ionicons
                name={action.icon}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      ))}

      {/* Main FAB Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons
            name="add"
            size={24}
            color="white"
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
    marginBottom: 16,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 12,
    fontWeight: '500',
    marginRight: 12,
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