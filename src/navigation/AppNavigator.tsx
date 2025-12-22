import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
    const [initialRoute, setInitialRoute] = useState<string | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
                setInitialRoute(hasSeenOnboarding === 'true' ? 'Splash' : 'Onboarding');
            } catch (e) {
                setInitialRoute('Onboarding');
            }
        };
        checkOnboarding();
    }, []);

    if (initialRoute === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
    );
};

export default AppNavigator;
