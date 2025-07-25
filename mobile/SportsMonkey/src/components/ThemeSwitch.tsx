import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ButtonGroup } from '@rneui/themed';
import { useTheme } from '../contexts/ThemeContext';
import { useThemeColors } from '../hooks/useThemeColors';

export const ThemeSwitch: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const colors = useThemeColors();

  const themeOptions = ['Light', 'Dark', 'System'];
  const selectedIndex = themeOptions.findIndex(option => 
    option.toLowerCase() === themeMode
  );

  const handleThemeChange = (selectedIndex: number) => {
    const selectedTheme = themeOptions[selectedIndex].toLowerCase() as 'light' | 'dark' | 'system';
    setThemeMode(selectedTheme);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
      <ButtonGroup
        buttons={themeOptions}
        selectedIndex={selectedIndex}
        onPress={handleThemeChange}
        containerStyle={styles.buttonGroup}
        selectedButtonStyle={[styles.selectedButton, { backgroundColor: colors.primary }]}
        textStyle={[styles.buttonText, { color: colors.text }]}
        selectedTextStyle={styles.selectedButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  buttonGroup: {
    marginHorizontal: 0,
    borderRadius: 8,
  },
  selectedButton: {
    // backgroundColor applied dynamically
  },
  buttonText: {
    fontSize: 14,
  },
  selectedButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});