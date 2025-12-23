import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { AppLightTheme, AppDarkTheme } from './src/theme/theme';
import { useColorScheme } from 'react-native';

function App(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const theme = (colorScheme === 'dark' ? AppDarkTheme : AppLightTheme) as unknown as MD3Theme;
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer theme={theme as any}>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
