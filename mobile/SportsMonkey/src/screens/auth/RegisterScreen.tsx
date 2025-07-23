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
import { isValidEmail, isValidPassword, isValidUsername } from '../../types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signUp } = useAuth();

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const { email, username, password, confirmPassword } = formData;

    if (!email.trim() || !username.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return false;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (!isValidUsername(username)) {
      Alert.alert(
        'Invalid Username', 
        'Username must be 3-50 characters long and contain only letters, numbers, and underscores'
      );
      return false;
    }

    if (!isValidPassword(password)) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return false;
    }

    if (!agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();

    if (!validateForm()) return;

    const { email, username, password, fullName } = formData;

    setLoading(true);
    const { error } = await signUp(
      email.trim().toLowerCase(), 
      password, 
      username.trim().toLowerCase(), 
      fullName.trim() || undefined
    );
    setLoading(false);

    if (error) {
      Alert.alert('Registration Failed', error);
    } else {
      Alert.alert(
        'Registration Successful!', 
        'Please check your email for verification instructions.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '#e0e0e0' };
    if (password.length < 6) return { strength: 1, label: 'Weak', color: '#f44336' };
    if (password.length < 8) return { strength: 2, label: 'Fair', color: '#ff9800' };
    if (password.length < 12 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'Good', color: '#4caf50' };
    }
    if (password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) {
      return { strength: 4, label: 'Strong', color: '#4caf50' };
    }
    return { strength: 2, label: 'Fair', color: '#ff9800' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
            <Text h2 style={styles.title}>Join Sports Buddy</Text>
            <Text style={styles.subtitle}>Create your account to start finding sports partners</Text>
          </View>

          <Card containerStyle={styles.card}>            
            <Input
              placeholder="Email Address *"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
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
              errorMessage={formData.email && !isValidEmail(formData.email) ? 'Please enter a valid email' : ''}
            />
            
            <Input
              placeholder="Username *"
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              leftIcon={
                <Icon
                  name="person"
                  type="material"
                  size={20}
                  color="#666"
                />
              }
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
              errorMessage={formData.username && !isValidUsername(formData.username) ? 
                'Username must be 3-50 characters, letters, numbers, and underscores only' : ''}
            />

            <Input
              placeholder="Full Name (Optional)"
              value={formData.fullName}
              onChangeText={(value) => handleInputChange('fullName', value)}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
              leftIcon={
                <Icon
                  name="badge"
                  type="material"
                  size={20}
                  color="#666"
                />
              }
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
            />
            
            <Input
              placeholder="Password *"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
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

            {formData.password.length > 0 && (
              <View style={styles.passwordStrength}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill, 
                      { width: `${(passwordStrength.strength / 4) * 100}%`, backgroundColor: passwordStrength.color }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            <Input
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              leftIcon={
                <Icon
                  name="lock-outline"
                  type="material"
                  size={20}
                  color="#666"
                />
              }
              rightIcon={
                <Icon
                  name={showConfirmPassword ? "visibility" : "visibility-off"}
                  type="material"
                  size={20}
                  color="#666"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              inputContainerStyle={styles.inputContainer}
              inputStyle={styles.input}
              errorMessage={
                formData.confirmPassword && 
                formData.password !== formData.confirmPassword ? 
                'Passwords do not match' : ''
              }
            />

            <CheckBox
              title={
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.linkText}>Terms of Service</Text> and <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              }
              checked={agreeToTerms}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
              containerStyle={styles.termsContainer}
              checkedColor="#2196F3"
            />
            
            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              buttonStyle={styles.registerButton}
              titleStyle={styles.registerButtonText}
              icon={
                <Icon
                  name="person-add"
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
                Alert.alert('Coming Soon', 'Google sign-up will be available in the next update!');
              }}
            />

            <View style={styles.loginPrompt}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Button
                title="Sign In"
                type="clear"
                onPress={() => navigation.goBack()}
                titleStyle={styles.loginButtonText}
                buttonStyle={styles.loginButton}
              />
            </View>
          </Card>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By creating an account, you agree to receive notifications about sports activities and matches in your area.
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
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logo: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 0,
  },
  input: {
    fontSize: 16,
    paddingLeft: 10,
  },
  passwordStrength: {
    marginTop: -10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 5,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
  termsContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    marginLeft: 0,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 10,
  },
  linkText: {
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  registerButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingVertical: 12,
    marginBottom: 20,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginButton: {
    padding: 0,
  },
  loginButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 11,
    lineHeight: 16,
  },
});