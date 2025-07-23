# Navigation Structure Guide

This document outlines the comprehensive navigation implementation using React Navigation v6 for the Sports Buddy mobile app.

## 📱 **Navigation Architecture**

### **Stack-Based Navigation**
The app uses a hierarchical stack-based navigation system with conditional rendering based on authentication state.

```
App
├── AuthProvider (Context)
└── NavigationContainer
    ├── AuthStack (unauthenticated users)
    │   ├── LoginScreen
    │   └── RegisterScreen
    └── MainStack (authenticated users)
        └── TabNavigator
            ├── NearbyPeopleScreen
            └── NearbyMatchesScreen
```

## 🔐 **Authentication Flow**

### **AppNavigator Component**
Central navigation component that determines which stack to show based on user authentication state.

```typescript
export const AppNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  
  return (
    <NavigationContainer>
      {user ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  );
};
```

### **Authentication States**
- **Loading**: Shows branded loading screen while checking auth state
- **Unauthenticated**: Shows AuthStack (Login/Register)
- **Authenticated**: Shows MainStack (Main app features)

## 📋 **Screen Definitions**

### **AuthStack Screens**

#### **LoginScreen**
- **Route**: `Login`
- **Features**:
  - Email/password authentication
  - Form validation with real-time feedback
  - Remember me checkbox
  - Forgot password functionality
  - Social login buttons (Google, Facebook)
  - Navigation to registration
  - Password visibility toggle

#### **RegisterScreen**
- **Route**: `Register`
- **Features**:
  - User registration form
  - Password strength indicator
  - Terms of service agreement
  - Real-time validation
  - Social registration options
  - Navigation back to login

### **MainStack Screens**

#### **TabNavigator**
- **Route**: `Tabs`
- **Features**:
  - Custom tab implementation
  - User profile access
  - Sign out functionality
  - Location-based features

#### **Additional Screens** (Future)
- **Profile**: `{ userId: string }`
- **MatchDetails**: `{ matchId: string }`
- **Chat**: `{ matchId: string }`
- **Settings**: `undefined`

## 🎨 **Screen Design Features**

### **Common Design Elements**
- **Consistent Branding**: Sports emoji logo (🏃‍♂️⚽)
- **Color Scheme**: Primary blue (#2196F3) with grey accents
- **Typography**: Material Design inspired text hierarchy
- **Card-Based Layouts**: Elevated cards with rounded corners
- **Icon Integration**: Material and FontAwesome icons

### **Interactive Elements**
- **Smart Buttons**: Loading states, disabled states, icon integration
- **Form Validation**: Real-time validation with error messages
- **Password Strength**: Visual strength indicator
- **Social Buttons**: Platform-specific styling and branding

### **Accessibility Features**
- **Keyboard Handling**: Dismiss on tap outside, proper keyboard avoidance
- **Touch Targets**: Minimum 44pt touch targets
- **Screen Reader Support**: Semantic elements and labels
- **High Contrast**: Sufficient color contrast ratios

## 🔧 **Technical Implementation**

### **Type Safety**
```typescript
// Auth Stack Parameter List
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Stack Parameter List  
export type MainStackParamList = {
  Tabs: undefined;
  Profile: { userId: string };
  MatchDetails: { matchId: string };
  Chat: { matchId: string };
  Settings: undefined;
};
```

### **Navigation Props**
```typescript
type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}
```

### **Screen Options**
```typescript
// Stack Navigator Configuration
<Stack.Navigator
  initialRouteName="Login"
  screenOptions={{
    headerStyle: { backgroundColor: '#2196F3' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
    cardStyle: { backgroundColor: '#f5f5f5' },
  }}
>
```

## 📱 **User Experience Flow**

### **First-Time User Journey**
1. **App Launch** → Loading Screen
2. **No Account** → Login Screen
3. **Create Account** → Register Screen
4. **Email Verification** → Login Screen
5. **Successful Login** → Main App (Tab Navigator)

### **Returning User Journey**
1. **App Launch** → Loading Screen
2. **Auto-Login** → Main App (Tab Navigator)
3. **Session Expired** → Login Screen

### **Navigation Patterns**
- **Stack Navigation**: Linear flow between related screens
- **Modal Presentation**: For temporary content (future)
- **Tab Navigation**: Primary app functionality switching
- **Drawer Navigation**: Secondary features (future)

## 🔒 **Security Considerations**

### **Authentication State Management**
- **Secure Storage**: JWT tokens in secure device storage
- **Auto-Logout**: Session expiration handling
- **Deep Link Protection**: Authenticated route protection

### **Form Security**
- **Input Validation**: Client and server-side validation
- **Password Policies**: Strength requirements and visibility controls
- **Rate Limiting**: Protection against brute force attempts

## 🚀 **Performance Optimizations**

### **Screen Lazy Loading**
- **Code Splitting**: Dynamic imports for large screens
- **Memory Management**: Proper component unmounting
- **Image Optimization**: Lazy loading for user avatars

### **Navigation Performance**
- **Gesture Handling**: Native gesture recognizers
- **Animation Optimization**: 60fps screen transitions
- **State Persistence**: Navigation state restoration

## 📊 **Analytics Integration**

### **Screen Tracking**
```typescript
// Navigation state change tracking
const onStateChange = (state) => {
  const currentScreen = getActiveRouteName(state);
  analytics.setCurrentScreen(currentScreen);
};
```

### **User Journey Analytics**
- **Authentication Events**: Login, logout, registration
- **Screen Views**: Time spent on each screen
- **User Actions**: Button taps, form submissions
- **Conversion Funnel**: Registration completion rates

## 🛠️ **Development Tools**

### **Navigation DevTools**
- **Flipper Integration**: Navigation tree inspection
- **Debug Mode**: Route parameter logging
- **Performance Monitor**: Navigation timing metrics

### **Testing Strategy**
- **Screen Testing**: Individual screen component tests
- **Navigation Testing**: Flow testing with React Navigation Testing Library
- **E2E Testing**: Full user journey automation

## 🔮 **Future Enhancements**

### **Advanced Navigation Features**
- **Tab Bar Customization**: Dynamic tab icons and badges
- **Drawer Navigation**: Settings and secondary features
- **Modal Stack**: Overlay screens for temporary content
- **Deep Linking**: URL-based navigation and sharing

### **Enhanced Authentication**
- **Biometric Authentication**: Face ID, Touch ID, Fingerprint
- **Multi-Factor Authentication**: SMS, authenticator app integration
- **Social Login Integration**: Google, Facebook, Apple Sign-In
- **Guest Mode**: Limited functionality without account

### **Personalization**
- **Onboarding Flow**: First-time user guidance
- **Theme Selection**: Light/dark mode switching
- **Language Selection**: Internationalization support
- **Accessibility Options**: Font size, contrast adjustments

This navigation structure provides a solid foundation for the Sports Buddy app with room for future expansion and feature additions.