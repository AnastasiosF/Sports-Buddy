import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '@rneui/themed';
import { useThemeColors } from '../../hooks/useThemeColors';

export const LoadingScreen: React.FC = () => {
  const colors = useThemeColors();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.logo}>🏃‍♂️⚽</Text>
      <Text h2 style={[styles.title, { color: colors.primary }]}>Sports Buddy</Text>
      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 40,
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
  },
});