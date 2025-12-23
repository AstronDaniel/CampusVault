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
            console.log('AppNavigator: Checking onboarding status...');
            try {
                const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
                console.log('AppNavigator: hasSeenOnboarding:', hasSeenOnboarding);
                setInitialRoute(hasSeenOnboarding === 'true' ? 'Splash' : 'Onboarding');
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
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
        </Stack.Navigator>
    );
};

export default AppNavigator;
