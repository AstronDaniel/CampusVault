// Initialize Reactotron in development mode
if (__DEV__) {
  try {
    require('./src/config/ReactotronConfig');
  } catch (error) {
    console.warn('[App] Reactotron initialization failed:', error);
  }
}

import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/config/toastConfig';
import { AppLightTheme, AppDarkTheme } from './src/theme/theme';
import { useColorScheme, StatusBar } from 'react-native';

function App(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const theme = (colorScheme === 'dark' ? AppDarkTheme : AppLightTheme) as unknown as MD3Theme;
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F172A"
      />
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer theme={theme as any}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
      {/* Toast must be the absolutely last component to sit on top of everything including Modals/Portals */}
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}

export default App;
