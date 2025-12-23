import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = () => {
    const theme = useTheme();
    const { logout, user } = useAuth();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={{ color: theme.colors.onBackground, marginBottom: 20 }}>
                Profile: {user?.username}
            </Text>
            <TouchableOpacity
                onPress={logout}
                style={{ padding: 15, backgroundColor: theme.colors.error, borderRadius: 10 }}
            >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Log Out</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default ProfileScreen;
