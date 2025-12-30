import React, { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
    FadeInDown,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface CustomInputProps {
    icon: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    isPassword?: boolean;
    delay?: number;
}

const CustomInput = ({
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    isPassword = false,
    delay = 0
}: CustomInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const focusProgress = useSharedValue(0);

    useEffect(() => {
        focusProgress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        const borderColor = interpolateColor(
            focusProgress.value,
            [0, 1],
            ['rgba(255, 255, 255, 0.2)', '#EC4899'] // White/Transparent -> Pink Neon
        );
        const backgroundColor = interpolateColor(
            focusProgress.value,
            [0, 1],
            ['rgba(255, 255, 255, 0.05)', 'rgba(236, 72, 153, 0.1)'] // Subtle -> Tinted
        );

        return {
            borderColor,
            backgroundColor,
            transform: [{ scale: withSpring(isFocused ? 1.02 : 1) }]
        };
    });

    return (
        <Animated.View
            entering={FadeInDown.delay(delay).duration(600).springify()}
            style={[styles.inputContainer, animatedStyle]}
        >
            <Icon name={icon} size={20} color={isFocused ? '#EC4899' : 'rgba(255,255,255,0.6)'} style={styles.inputIcon} />
            <TextInput
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry && !showPassword}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoCapitalize="none"
            />
            {isPassword && (
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Icon
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color="rgba(255,255,255,0.6)"
                    />
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 15,
        overflow: 'hidden',
    },
    inputIcon: {
        marginRight: 10,
    },
    textInput: {
        flex: 1,
        color: '#ffffff',
        fontSize: 16,
        paddingVertical: 10,
    },
    eyeIcon: {
        padding: 5,
    },
});

export default CustomInput;
