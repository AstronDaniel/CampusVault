import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    StatusBar,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Dimensions
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolateColor
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { IMAGES } from '../../config/images';

const { width } = Dimensions.get('window');
const BACKGROUND_IMAGE = IMAGES.AUTH_BACKGROUND;

import CustomInput from '../../components/common/CustomInput';

const LoginScreen = ({ navigation }: { navigation: any }) => {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        // Mock Login
        navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
        });
    };

    return (
        <ImageBackground source={BACKGROUND_IMAGE} style={styles.background} resizeMode="cover">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Gradient Overlay */}
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={styles.content}>

                    {/* Header: Logo or Welcome Text */}
                    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Icon name="atom" size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>Hello Again!</Text>
                        <Text style={styles.subtitle}>Welcome back, you've been missed.</Text>
                    </Animated.View>

                    {/* Inputs Section */}
                    <View style={styles.formContainer}>
                        <CustomInput
                            icon="email-outline"
                            placeholder="Enter email"
                            value={email}
                            onChangeText={setEmail}
                            delay={400}
                        />
                        <CustomInput
                            icon="lock-outline"
                            placeholder="Enter password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            isPassword
                            delay={500}
                        />

                        {/* Forgot Password */}
                        <Animated.View entering={FadeInDown.delay(600).duration(600)}>
                            <TouchableOpacity style={styles.forgotPass}>
                                <Text style={styles.forgotPassText}>Recovery Password</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Custom Neon Button */}
                        <Animated.View entering={FadeInDown.delay(700).springify()}>
                            <TouchableOpacity
                                style={styles.loginBtn}
                                activeOpacity={0.8}
                                onPress={handleLogin}
                            >
                                <View style={styles.btnGradient} />
                                <Text style={styles.loginBtnText}>Sign In</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.delay(900).duration(600)} style={styles.footer}>
                        <Text style={styles.footerText}>Not a member? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.signupText}>Register now</Text>
                        </TouchableOpacity>
                    </Animated.View>

                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 10, 20, 0.85)', // Deep dark blue/black tint
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
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
        paddingVertical: 10, // Better touch area
    },
    eyeIcon: {
        padding: 5,
    },
    forgotPass: {
        alignSelf: 'flex-end',
        marginBottom: 30,
    },
    forgotPassText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
    },
    loginBtn: {
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#EC4899', // Fallback color
        shadowColor: "#EC4899",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    btnGradient: {
        ...StyleSheet.absoluteFillObject,
        // Linear gradient simulated by background color for now (nativewind/expo-linear-gradient would be better but keeping it simple/generic)
        backgroundColor: '#EC4899',
        opacity: 0.9,
    },
    loginBtnText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 50,
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    signupText: {
        color: '#EC4899',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default LoginScreen;
