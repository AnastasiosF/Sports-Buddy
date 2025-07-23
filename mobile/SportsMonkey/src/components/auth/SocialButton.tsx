import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Icon } from 'react-native-elements';

interface SocialButtonProps {
  provider: 'google' | 'facebook' | 'apple';
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  onPress,
  loading = false,
  disabled = false,
}) => {
  const getProviderConfig = () => {
    switch (provider) {
      case 'google':
        return {
          title: 'Continue with Google',
          iconName: 'google',
          iconType: 'font-awesome',
          iconColor: '#4285F4',
        };
      case 'facebook':
        return {
          title: 'Continue with Facebook',
          iconName: 'facebook',
          iconType: 'font-awesome',
          iconColor: '#1877F2',
        };
      case 'apple':
        return {
          title: 'Continue with Apple',
          iconName: 'apple',
          iconType: 'font-awesome',
          iconColor: '#000',
        };
      default:
        return {
          title: 'Continue',
          iconName: 'account',
          iconType: 'material',
          iconColor: '#666',
        };
    }
  };

  const config = getProviderConfig();

  return (
    <Button
      title={config.title}
      buttonStyle={styles.socialButton}
      titleStyle={styles.socialButtonText}
      loading={loading}
      disabled={disabled}
      icon={
        !loading && (
          <Icon
            name={config.iconName}
            type={config.iconType}
            size={16}
            color={config.iconColor}
            style={styles.socialIcon}
          />
        )
      }
      onPress={onPress}
    />
  );
};

const styles = StyleSheet.create({
  socialButton: {
    backgroundColor: '#4285f4',
    borderRadius: 25,
    paddingVertical: 12,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
  },
  socialIcon: {
    marginRight: 8,
  },
});