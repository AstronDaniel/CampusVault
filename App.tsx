import React from 'react';
import { useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider, MD3Theme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AppLightTheme, AppDarkTheme } from './src/theme/theme';

function App(): React.JSX.Element {
  const colorScheme = useColorScheme();
  const theme = (colorScheme === 'dark' ? AppDarkTheme : AppLightTheme) as unknown as MD3Theme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer theme={theme as any}>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
