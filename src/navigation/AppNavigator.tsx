import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import SplashScreen from '../screens/ModernSplashScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/EnhancedOnboardingScreen';

const Stack = createNativeStackNavigator();

import { useAuth } from '../context/AuthContext';

const AppNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
                setIsFirstLaunch(hasSeen !== 'true');
            } catch (e) {
                setIsFirstLaunch(false);
            }
        };
        checkOnboarding();
    }, []);

    if (isLoading || isFirstLaunch === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#EC4899" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                // Authenticated Stack
                <Stack.Screen name="Home" component={HomeScreen} />
            ) : (
                // Non-Authenticated Stack
                <>
                    {isFirstLaunch && (
                        <Stack.Screen name="Onboarding">
                            {(props) => (
                                <OnboardingScreen
                                    {...props}
                                    onComplete={() => {
                                        AsyncStorage.setItem('hasSeenOnboarding', 'true');
                                        setIsFirstLaunch(false);
                                    }}
                                />
                            )}
                        </Stack.Screen>
                    )}
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
