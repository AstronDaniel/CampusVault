import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    StatusBar,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomInput from '../components/common/CustomInput';

const BACKGROUND_IMAGE = { uri: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop' }; // Consistency

const SignUpScreen = ({ navigation }: { navigation: any }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSignUp = () => {
        // Mock Registration
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
                <ScrollView contentContainerStyle={styles.content}>

                    {/* Header */}
                    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Icon name="account-plus-outline" size={40} color="#fff" />
                        </View>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join the future of campus life.</Text>
                    </Animated.View>

                    {/* Inputs Section */}
                    <View style={styles.formContainer}>
                        <CustomInput
                            icon="account-outline"
                            placeholder="Full Name"
                            value={name}
                            onChangeText={setName}
                            delay={300}
                        />
                        <CustomInput
                            icon="email-outline"
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            delay={400}
                        />
                        <CustomInput
                            icon="lock-outline"
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            isPassword
                            delay={500}
                        />
                        <CustomInput
                            icon="lock-check-outline"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            isPassword
                            delay={600}
                        />

                        {/* Custom Neon Button (Different Color for Sign Up) */}
                        <Animated.View entering={FadeInDown.delay(700).springify()}>
                            <TouchableOpacity
                                style={styles.loginBtn}
                                activeOpacity={0.8}
                                onPress={handleSignUp}
                            >
                                <View style={styles.btnGradient} />
                                <Text style={styles.loginBtnText}>Create Account</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.delay(900).duration(600)} style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.signupText}>Log In</Text>
                        </TouchableOpacity>
                    </Animated.View>

                </ScrollView>
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
        backgroundColor: 'rgba(10, 10, 20, 0.85)',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 60,
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
    loginBtn: {
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 20,
        backgroundColor: '#8B5CF6', // Purple for Sign Up to distinguish
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    btnGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#8B5CF6',
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
        marginTop: 40,
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    signupText: {
        color: '#8B5CF6', // Purple text
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default SignUpScreen;
