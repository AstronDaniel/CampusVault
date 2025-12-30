import {
    MD3DarkTheme as PaperDarkTheme,
    MD3LightTheme as PaperDefaultTheme,
    adaptNavigationTheme,
    configureFonts,
} from 'react-native-paper';
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
});

// Configure fonts for Material Design 3
const fontConfig = {
    fontFamily: 'System',
};

const fonts = configureFonts({ config: fontConfig });

// Creative "Premium" Light Theme
export const AppLightTheme = {
    ...PaperDefaultTheme,
    ...LightTheme,
    fonts,
    colors: {
        ...PaperDefaultTheme.colors,
        ...LightTheme.colors,
        primary: '#4F46E5', // Indigo 600
        onPrimary: '#FFFFFF',
        primaryContainer: '#E0E7FF',
        onPrimaryContainer: '#3730A3',
        secondary: '#EC4899', // Pink 500
        onSecondary: '#FFFFFF',
        secondaryContainer: '#FCE7F3',
        onSecondaryContainer: '#9D174D',
        background: '#F8FAFC', // Slate 50
        surface: '#FFFFFF',
        surfaceVariant: '#F1F5F9', // Slate 100
        outline: '#94A3B8',
        elevation: {
            level0: 'transparent',
            level1: '#FFFFFF',
            level2: '#F8FAFC',
            level3: '#F1F5F9',
            level4: '#E2E8F0',
            level5: '#CBD5E1',
        },
    },
};

// Creative "Premium" Dark Theme (Neon/Cyberpunk vibes)
export const AppDarkTheme = {
    ...PaperDarkTheme,
    ...DarkTheme,
    fonts,
    colors: {
        ...PaperDarkTheme.colors,
        ...DarkTheme.colors,
        primary: '#10B981', // Emerald 500
        onPrimary: '#064E3B',
        primaryContainer: '#065F46',
        onPrimaryContainer: '#D1FAE5',
        secondary: '#06B6D4', // Cyan 500
        onSecondary: '#083344',
        secondaryContainer: '#164E63',
        onSecondaryContainer: '#CFFAFE',
        background: '#121212', // Pure Charcoal
        surface: '#1E1E1E', // Dark Neutral Gray
        surfaceVariant: '#2D2D2D', // Medium Neutral Gray
        outline: '#525252',
        error: '#EF4444',
        elevation: {
            level0: 'transparent',
            level1: '#1E1E1E',
            level2: '#262626',
            level3: '#333333',
            level4: '#404040',
            level5: '#525252',
        },
    },
};
