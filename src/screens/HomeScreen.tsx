import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CVButton from '../components/common/CVButton';

const HomeScreen = ({ navigation }: { navigation: any }) => {
    const theme = useTheme();
    const styles = createStyles(theme);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text variant="headlineMedium" style={styles.title}>
                    Welcome to CampusVault
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    React Native Edition
                </Text>

                <View style={{ marginTop: 20 }}>
                    <Text variant="titleMedium" style={{ marginBottom: 10, textAlign: 'center' }}>Debug Menu</Text>
                    <CVButton onPress={() => navigation.navigate('Login')} style={{ marginBottom: 10 }}>
                        Go to Login Screen
                    </CVButton>
                    <CVButton onPress={() => navigation.navigate('SignUp')} style={{ marginBottom: 10 }}>
                        Go to Sign Up Screen
                    </CVButton>
                    <CVButton
                        onPress={async () => {
                            await AsyncStorage.removeItem('hasSeenOnboarding');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Splash' }],
                            });
                        }}
                        style={{ backgroundColor: theme.colors.error }}
                    >
                        Reset Onboarding (Clear Data)
                    </CVButton>
                </View>
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        marginBottom: 10,
        textAlign: 'center',
        color: theme.colors.onBackground,
    },
    subtitle: {
        marginBottom: 30,
        textAlign: 'center',
        color: theme.colors.onSurfaceVariant,
        opacity: 0.7,
    },
});

export default HomeScreen;
