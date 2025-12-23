import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ModernSplashScreen from './src/screens/ModernSplashScreen';
import EnhancedOnboardingScreen from './src/screens/EnhancedOnboardingScreen';
import AuthScreen from './src/screens/auth/AuthScreen';
import ModernHomeScreen from './src/screens/ModernHomeScreen';
import { AuthProvider } from './src/context/AuthContext';
import { AppLightTheme, AppDarkTheme } from './src/theme/theme';
import { useColorScheme } from 'react-native';

function App(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const theme = (colorScheme === 'dark' ? AppDarkTheme : AppLightTheme) as unknown as MD3Theme;
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (showSplash) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <ModernSplashScreen onAnimationComplete={() => setShowSplash(false)} />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <EnhancedOnboardingScreen onComplete={() => setShowOnboarding(false)} />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <AuthScreen onAuthSuccess={() => setIsAuthenticated(true)} />
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer theme={theme as any}>
            <ModernHomeScreen onLogout={() => setIsAuthenticated(false)} />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
