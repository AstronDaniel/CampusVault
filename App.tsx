import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ModernSplashScreen from './src/screens/ModernSplashScreen';
import EnhancedOnboardingScreen from './src/screens/EnhancedOnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import { AppLightTheme, AppDarkTheme } from './src/theme/theme';
import { useColorScheme } from 'react-native';

function App(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const theme = (colorScheme === 'dark' ? AppDarkTheme : AppLightTheme) as unknown as MD3Theme;
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

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

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer theme={theme as any}>
          <HomeScreen />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
