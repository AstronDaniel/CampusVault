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

const AppNavigator = () => {
    const [initialRoute, setInitialRoute] = useState<string | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            console.log('AppNavigator: Checking onboarding status...');
            try {
                const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
                console.log('AppNavigator: hasSeenOnboarding:', hasSeenOnboarding);
                // FOR DEVELOPMENT: Force Login Screen
                console.log('AppNavigator: Dev mode forcing Login');
                setInitialRoute('Login');
                // setInitialRoute(hasSeenOnboarding === 'true' ? 'Login' : 'Onboarding');
            } catch (e) {
                console.error('AppNavigator: Error reading AsyncStorage', e);
                setInitialRoute('Onboarding');
            }
        };
        checkOnboarding();
    }, []);

    if (initialRoute === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    return (
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding">
                {(props) => (
                    <OnboardingScreen
                        {...props}
                        onComplete={() => {
                            AsyncStorage.setItem('hasSeenOnboarding', 'true');
                            props.navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }}
                    />
                )}
            </Stack.Screen>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
    );
};

export default AppNavigator;
