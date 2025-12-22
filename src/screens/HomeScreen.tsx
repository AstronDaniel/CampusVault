import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CVButton from '../components/common/CVButton';

const HomeScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Welcome to CampusVault (React Native)</Text>
            <CVButton onPress={() => console.log('Pressed')}>
                Components Working!
            </CVButton>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    text: {
        fontSize: 20,
        marginBottom: 20,
        color: '#333',
    },
});

export default HomeScreen;
