import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { 
  Input, 
  Button, 
  Text, 
  Card, 
  Icon,
  CheckBox 
} from '@rneui/themed';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { isValidEmail } from '../../types';
import { useThemeColors } from '../../hooks/useThemeColors';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { signIn } = useAuth();
  const colors = useThemeColors();

  const handleLogin = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Enter Email', 'Please enter your email address first');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // TODO: Implement password reset
    Alert.alert(
      'Password Reset',
      'Password reset functionality will be implemented soon. Please contact support if you need assistance.'
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.surface }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>🏃‍♂️⚽</Text>
            <Text h1 style={[styles.title, { color: colors.primary }]}>Sports Buddy</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Find your perfect sports partner</Text>
          </View>

          <Card containerStyle={[styles.card, { backgroundColor: colors.card }]}>
            <Text h4 style={[styles.cardTitle, { color: colors.text }]}>Welcome Back!</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Sign in to continue your sports journey</Text>
            
            <Input
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              leftIcon={
                <Icon
                  name="email"
                  type="material"
                  size={20}
                  color={colors.textSecondary}
                />
              }
              inputContainerStyle={[styles.inputContainer, { borderBottomColor: colors.border }]}
              inputStyle={[styles.input, { color: colors.text }]}
              errorMessage={email && !isValidEmail(email) ? 'Please enter a valid email' : ''}
            />
            
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              leftIcon={
                <Icon
                  name="lock"
                  type="material"
                  size={20}
                  color={colors.textSecondary}
                />
              }
              rightIcon={
                <Icon
                  name={showPassword ? "visibility" : "visibility-off"}
                  type="material"
                  size={20}
                  color={colors.textSecondary}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              inputContainerStyle={[styles.inputContainer, { borderBottomColor: colors.border }]}
              inputStyle={[styles.input, { color: colors.text }]}
            />

            <View style={styles.optionsRow}>
              <CheckBox
                title="Remember me"
                checked={rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
                containerStyle={styles.checkboxContainer}
                textStyle={[styles.checkboxText, { color: colors.textSecondary }]}
                checkedColor={colors.primary}
              />
              
              <Button
                title="Forgot Password?"
                type="clear"
                onPress={handleForgotPassword}
                titleStyle={[styles.forgotPasswordText, { color: colors.primary }]}
                buttonStyle={styles.forgotPasswordButton}
              />
            </View>
            
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              buttonStyle={[styles.signInButton, { backgroundColor: colors.primary }]}
              titleStyle={styles.signInButtonText}
              icon={
                <Icon
                  name="login"
                  type="material"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
              }
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <Button
              title="Continue with Google"
              buttonStyle={[styles.socialButton, { backgroundColor: colors.primary }]}
              titleStyle={styles.socialButtonText}
              icon={
                <Icon
                  name="google"
                  type="font-awesome"
                  size={16}
                  color="white"
                  style={{ marginRight: 8 }}
                />
              }
              onPress={() => {
                Alert.alert('Coming Soon', 'Google sign-in will be available in the next update!');
              }}
            />

            <View style={styles.signUpPrompt}>
              <Text style={[styles.signUpText, { color: colors.textSecondary }]}>Don't have an account? </Text>
              <Button
                title="Sign Up"
                type="clear"
                onPress={() => navigation.navigate('Register')}
                titleStyle={[styles.signUpButtonText, { color: colors.primary }]}
                buttonStyle={styles.signUpButton}
              />
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  logo: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    borderRadius: 15,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 5,
  },
  cardSubtitle: {
    textAlign: 'center',
    marginBottom: 25,
    fontSize: 14,
  },
  inputContainer: {
    borderBottomWidth: 1,
    paddingHorizontal: 0,
  },
  input: {
    fontSize: 16,
    paddingLeft: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  forgotPasswordButton: {
    padding: 0,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  signInButton: {
    borderRadius: 25,
    paddingVertical: 12,
    marginTop: 20,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 15,
    fontSize: 12,
  },
  socialButton: {
    borderRadius: 25,
    paddingVertical: 12,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
  },
  signUpPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    fontSize: 16,
  },
  signUpButton: {
    padding: 0,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});