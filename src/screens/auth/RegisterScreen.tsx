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
    ScrollView,
    ActivityIndicator
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

import { IMAGES } from '../../config/images';
import CustomInput from '../../components/common/CustomInput';
import GlassDropdown from '../../components/common/GlassDropdown';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

const BACKGROUND_IMAGE = IMAGES.AUTH_BACKGROUND;

const RegisterScreen = ({ navigation }: { navigation: any }) => {
    const { register, isProcessing } = useAuth();

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    // Store IDs for backend, but we need full objects for dropdown data
    const [facultyId, setFacultyId] = useState<number | null>(null);
    const [programId, setProgramId] = useState<number | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Data State
    const [faculties, setFaculties] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);

    // Fetch Faculties on Mount
    useEffect(() => {
        loadFaculties();
    }, []);

    const loadFaculties = async () => {
        try {
            const data = await authService.getFaculties();
            // Map legacy response to DropdownItem format if needed
            // Assuming data is array of { id, name }
            const formatted = data.map((f: any) => ({ id: f.id, label: f.name }));
            setFaculties(formatted);
        } catch (error) {
            console.error('Failed to load faculties', error);
        }
    };

    // Fetch Programs when Faculty Changes
    const handleFacultyChange = async (item: any) => {
        setFacultyId(item.id);
        setProgramId(null); // Reset program
        setPrograms([]); // Clear previous

        try {
            const data = await authService.getPrograms(item.id);
            const formatted = data.map((p: any) => ({ id: p.id, label: p.name }));
            setPrograms(formatted);
        } catch (error) {
            console.error('Failed to load programs', error);
        }
    };

    const handleRegister = async () => {
        if (!name || !email || !facultyId || !programId || !password || !confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Missing Information',
                text2: 'Please fill in all fields.',
                topOffset: 60
            });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({
                type: 'error',
                text1: 'Password Mismatch',
                text2: 'Passwords do not match.',
                topOffset: 60
            });
            return;
        }

        try {
            await register({
                username: name,
                email,
                password,
                faculty_id: facultyId,
                program_id: programId
            });

            Toast.show({
                type: 'success',
                text1: 'Welcome!',
                text2: 'Account created successfully.',
                topOffset: 60
            });
            // Navigation handled by AppNavigator (isAuthenticated -> true)
        } catch (err: any) {
            console.log('[RegisterScreen] Error:', err);

            let errorMessage = 'Something went wrong.';

            if (err.detail) {
                errorMessage = err.detail;
            } else if (err.message) {
                errorMessage = err.message;
            } else if (err.error) {
                errorMessage = err.error;
            } else if (err.errors) {
                // Handle nested validation errors (e.g. { errors: { email: ['Already taken'] } })
                const firstField = Object.keys(err.errors)[0];
                if (firstField && Array.isArray(err.errors[firstField])) {
                    errorMessage = err.errors[firstField][0];
                }
            } else if (typeof err === 'string') {
                errorMessage = err;
            }

            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: errorMessage,
                topOffset: 60
            });
        }
    };

    return (
        <ImageBackground source={BACKGROUND_IMAGE} style={styles.background} resizeMode="cover">
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <View style={styles.overlay} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
                        <View style={styles.iconCircle}>
                            <Icon name="account-plus-outline" size={35} color="#fff" />
                        </View>
                        <Text style={styles.title}>Join Us</Text>
                        <Text style={styles.subtitle}>Create your student account.</Text>
                    </Animated.View>

                    {/* Inputs */}
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

                        {/* Dropdowns */}
                        <Animated.View entering={FadeInDown.delay(450).duration(500)}>
                            <GlassDropdown
                                data={faculties}
                                value={facultyId}
                                onChange={handleFacultyChange}
                                placeholder="Select Faculty"
                                icon="school-outline"
                            />
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
                            <GlassDropdown
                                data={programs}
                                value={programId}
                                onChange={(item) => setProgramId(item.id as number)}
                                placeholder="Select Program"
                                icon="book-open-page-variant-outline"
                            />
                        </Animated.View>

                        <CustomInput
                            icon="lock-outline"
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            isPassword
                            delay={550}
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

                        {/* Button */}
                        <Animated.View entering={FadeInDown.delay(700).springify()}>
                            <TouchableOpacity
                                style={styles.registerBtn}
                                activeOpacity={0.8}
                                onPress={handleRegister}
                            >
                                <View style={styles.btnGradient} />
                                {isProcessing ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerBtnText}>Create Account</Text>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Footer */}
                    <Animated.View entering={FadeInDown.delay(900).duration(600)} style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Log In</Text>
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
        backgroundColor: 'rgba(10, 10, 20, 0.9)', // Slightly darker for register
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 30,
        paddingBottom: 40,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
    },
    formContainer: {
        width: '100%',
    },
    registerBtn: {
        height: 60,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        marginTop: 10,
        backgroundColor: '#8B5CF6',
        shadowColor: "#8B5CF6",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    btnGradient: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#8B5CF6', // Purple for Register
        opacity: 0.9,
    },
    registerBtnText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    footerText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
    },
    loginLink: {
        color: '#8B5CF6',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default RegisterScreen;
