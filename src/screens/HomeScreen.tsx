import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CVButton from '../components/common/CVButton';

const HomeScreen = () => {
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
                <CVButton onPress={() => console.log('Pressed')}>
                    Components Working!
                </CVButton>
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
