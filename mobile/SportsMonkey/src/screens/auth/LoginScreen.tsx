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
} from 'react-native-elements';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { isValidEmail } from '../../types';

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
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>🏃‍♂️⚽</Text>
            <Text h1 style={styles.title}>Sports Buddy</Text>
            <Text style={styles.subtitle}>Find your perfect sports partner</Text>
          </View>

          <Card containerStyle={styles.card}>
            <Text h4 style={styles.cardTitle}>Welcome Back!</Text>
            <Text style={styles.cardSubtitle}>Sign in to continue your sports journey</Text>
            
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
                  color="#666"
                />
              }
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
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
                  color="#666"
                />
              }
              rightIcon={
                <Icon
                  name={showPassword ? "visibility" : "visibility-off"}
                  type="material"
                  size={20}
                  color="#666"
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
            />

            <View style={styles.optionsRow}>
              <CheckBox
                title="Remember me"
                checked={rememberMe}
                onPress={() => setRememberMe(!rememberMe)}
                containerStyle={styles.checkboxContainer}
                textStyle={styles.checkboxText}
                checkedColor="#2196F3"
              />
              
              <Button
                title="Forgot Password?"
                type="clear"
                onPress={handleForgotPassword}
                titleStyle={styles.forgotPasswordText}
                buttonStyle={styles.forgotPasswordButton}
              />
            </View>
            
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              buttonStyle={styles.signInButton}
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
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title="Continue with Google"
              buttonStyle={styles.socialButton}
              titleStyle={styles.socialButtonText}
              icon={
                <Icon
                  name="google"
                  type="font-awesome"
                  size={16}
                  color="#4285F4"
                  style={{ marginRight: 8 }}
                />
              }
              onPress={() => {
                Alert.alert('Coming Soon', 'Google sign-in will be available in the next update!');
              }}
            />

            <View style={styles.signUpPrompt}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <Button
                title="Sign Up"
                type="clear"
                onPress={() => navigation.navigate('Register')}
                titleStyle={styles.signUpButtonText}
                buttonStyle={styles.signUpButton}
              />
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
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
    backgroundColor: '#f5f5f5',
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
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    color: '#666',
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
    color: '#333',
    marginBottom: 5,
  },
  cardSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 25,
    fontSize: 14,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: '#666',
    fontWeight: 'normal',
  },
  forgotPasswordButton: {
    padding: 0,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#2196F3',
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
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    color: '#999',
    paddingHorizontal: 15,
    fontSize: 12,
  },
  socialButton: {
    backgroundColor: '#4285f4',
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
    color: '#666',
    fontSize: 16,
  },
  signUpButton: {
    padding: 0,
  },
  signUpButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
  },
});