import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CreativeLoginScreen from './CreativeLoginScreen';
import RegisterScreen from './RegisterScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';

const { width, height } = Dimensions.get('window');

export type AuthMode = 'login' | 'register' | 'forgot-password';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const theme = useTheme();
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const styles = createStyles(theme);

  const renderAuthContent = () => {
    switch (authMode) {
      case 'login':
        return (
          <CreativeLoginScreen
            onAuthSuccess={onAuthSuccess}
            onSwitchToRegister={() => setAuthMode('register')}
            onSwitchToForgotPassword={() => setAuthMode('forgot-password')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onAuthSuccess={onAuthSuccess}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        );
      case 'forgot-password':
        return (
          <ForgotPasswordScreen
            onBackToLogin={() => setAuthMode('login')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Auth Content */}
      <View style={styles.contentContainer}>
        {renderAuthContent()}
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorativeElements}>
        <View style={[styles.decorativeCircle, styles.circle1]} />
        <View style={[styles.decorativeCircle, styles.circle2]} />
        <View style={[styles.decorativeCircle, styles.circle3]} />
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: 0,
      zIndex: 2,
    },
    decorativeElements: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
    },
    decorativeCircle: {
      position: 'absolute',
      borderRadius: 100,
      opacity: 0.05,
    },
    circle1: {
      width: 120,
      height: 120,
      backgroundColor: theme.colors.secondary,
      top: height * 0.15,
      right: -60,
    },
    circle2: {
      width: 80,
      height: 80,
      backgroundColor: theme.colors.tertiary,
      bottom: height * 0.3,
      left: -40,
    },
    circle3: {
      width: 60,
      height: 60,
      backgroundColor: theme.colors.primary,
      top: height * 0.6,
      right: width * 0.1,
    },
  });

export default AuthScreen;