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
    regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
    },
    medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
    },
    light: {
        fontFamily: 'System',
        fontWeight: '300' as const,
    },
    thin: {
        fontFamily: 'System',
        fontWeight: '100' as const,
    },
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
        primary: '#818CF8', // Indigo 400
        onPrimary: '#1E1B4B',
        primaryContainer: '#3730A3',
        onPrimaryContainer: '#E0E7FF',
        secondary: '#F472B6', // Pink 400
        onSecondary: '#500724',
        secondaryContainer: '#831843',
        onSecondaryContainer: '#FCE7F3',
        background: '#0F172A', // Slate 900
        surface: '#1E293B', // Slate 800
        surfaceVariant: '#334155', // Slate 700
        outline: '#64748B',
        error: '#CF6679',
        elevation: {
            level0: 'transparent',
            level1: '#1E293B',
            level2: '#334155',
            level3: '#475569',
            level4: '#64748B',
            level5: '#94A3B8',
        },
    },
};
