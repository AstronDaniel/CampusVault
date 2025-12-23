import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/*
  Custom Toast Config for "Glass & Neon" Aesthetic
*/

const toastStyles = StyleSheet.create({
    baseContainer: {
        height: 60,
        width: '90%',
        backgroundColor: 'rgba(20, 20, 30, 0.85)', // Dark Glass
        borderRadius: 16,
        borderLeftWidth: 0, // Override default color strip
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 9999, // Ensure it's on top
        zIndex: 9999,
    },
    successBorder: {
        borderColor: '#10B981', // Neon Green
        shadowColor: '#10B981',
    },
    errorBorder: {
        borderColor: '#EF4444', // Neon Red
        shadowColor: '#EF4444',
    },
    contentContainer: {
        paddingHorizontal: 10,
        flex: 1,
    },
    text1: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    text2: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.7)',
    }
});

export const toastConfig = {
    success: ({ text1, text2, props }: any) => (
        <View style={[toastStyles.baseContainer, toastStyles.successBorder]}>
            <Icon name="check-circle-outline" size={24} color="#10B981" />
            <View style={toastStyles.contentContainer}>
                <Text style={toastStyles.text1}>{text1}</Text>
                {text2 && <Text style={toastStyles.text2}>{text2}</Text>}
            </View>
        </View>
    ),
    error: ({ text1, text2, props }: any) => (
        <View style={[toastStyles.baseContainer, toastStyles.errorBorder]}>
            <Icon name="alert-circle-outline" size={24} color="#EF4444" />
            <View style={toastStyles.contentContainer}>
                <Text style={toastStyles.text1}>{text1}</Text>
                {text2 && <Text style={toastStyles.text2}>{text2}</Text>}
            </View>
        </View>
    ),
};
