import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const SplashScreen = ({ navigation }: { navigation: any }) => {
    useEffect(() => {
        // Navigate to Home after animation finishes or after a delay
        const timer = setTimeout(() => {
            // Navigation reset is better for splash screens to prevent going back
            navigation.reset({
                index: 0,
                routes: [{ name: 'Home' }],
            });
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <LottieView
                source={require('../assets/animations/splash.json')}
                autoPlay
                loop={false}
                style={styles.animation}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff', // Or your desired splash background color
    },
    animation: {
        width: 250,
        height: 250,
    },
});

export default SplashScreen;
