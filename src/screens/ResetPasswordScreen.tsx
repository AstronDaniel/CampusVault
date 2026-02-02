import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { API_CONFIG } from '../config/api';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { IMAGES } from '../config/images';

const { width } = Dimensions.get('window');

const ResetPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Missing Email',
        text2: 'Please enter your email address.',
      });
      return;
    }
    
    setLoading(true);
    try {
      // Call the new 5-character code API
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD_REQUEST}`,
      { email }
    );
      Toast.show({
        type: 'success',
        text1: 'Code Sent',
        text2: 'Check your email for the 5-character reset code.',
      });
      setStep('code');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: error?.response?.data?.detail || 'Could not send reset code',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 5) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: 'Please enter the 5-character code.',
      });
      return;
    }
    
    setLoading(true);
    try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD_VALIDATE}`,
      { 
        email, 
        code: code.toUpperCase() 
      }
    );
      Toast.show({
        type: 'success',
        text1: 'Code Verified',
        text2: 'Now enter your new password.',
      });
      setStep('password');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: error?.response?.data?.detail || 'The code is incorrect or expired',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Missing Password',
        text2: 'Please enter your new password.',
      });
      return;
    }
    
    if (newPassword.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 8 characters.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Mismatch',
        text2: 'Passwords do not match.',
      });
      return;
    }

    setLoading(true);
    try {
    const response = await axios.post(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD_CONFIRM}`,
      {
        email,
        code: code.toUpperCase(),
        new_password: newPassword,
      }
    );
      Toast.show({
        type: 'success',
        text1: 'Password Reset',
        text2: 'Your password has been successfully reset.',
      });
      navigation.navigate('Login');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error?.response?.data?.detail || 'Could not reset password',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <>
            {/* Header */}
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
              <View style={styles.iconCircle}>
                <Icon name="email-outline" size={40} color="#fff" />
              </View>
              <Text style={styles.title}>Reset Password</Text>
              <Text style={styles.subtitle}>Enter your email to receive a 5-character reset code</Text>
            </Animated.View>

            {/* Email Input */}
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Icon name="email-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#64748b"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </Animated.View>

            {/* Send Code Button */}
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <TouchableOpacity
                style={[styles.actionButton, (!email || loading) && styles.actionButtonDisabled]}
                onPress={handleSendCode}
                disabled={!email || loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3b82f6', '#1d4ed8']}
                  style={styles.gradientButton}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  {loading && <Icon name="loading" size={20} color="#fff" style={[styles.buttonIcon, { marginRight: 8 }]} />}
                  <Text style={styles.actionButtonText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        );

      case 'code':
        return (
          <>
            {/* Header */}
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
              <View style={styles.iconCircle}>
                <Icon name="key-variant" size={40} color="#fff" />
              </View>
              <Text style={styles.title}>Enter Reset Code</Text>
              <Text style={styles.subtitle}>Check your email for the 5-character code we just sent to {email}</Text>
            </Animated.View>

            {/* Code Input */}
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <View style={styles.codeContainer}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="ABCD9"
                  placeholderTextColor="#64748b"
                  value={code}
                  onChangeText={(text) => setCode(text.toUpperCase())}
                  maxLength={5}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  textAlign="center"
                />
              </View>
            </Animated.View>

            {/* Verify Code Button */}
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <TouchableOpacity
                style={[styles.actionButton, (code.length !== 5 || loading) && styles.actionButtonDisabled]}
                onPress={handleVerifyCode}
                disabled={code.length !== 5 || loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.gradientButton}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  {loading && <Icon name="loading" size={20} color="#fff" style={[styles.buttonIcon, { marginRight: 8 }]} />}
                  <Text style={styles.actionButtonText}>{loading ? 'Verifying...' : 'Verify Code'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Back to Email Button */}
            <Animated.View entering={FadeInDown.delay(600).springify()}>
              <TouchableOpacity
                style={styles.backToEmailButton}
                onPress={() => setStep('email')}
                activeOpacity={0.8}
              >
                <Text style={styles.backToEmailText}>Back to Email</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        );

      case 'password':
        return (
          <>
            {/* Header */}
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
              <View style={styles.iconCircle}>
                <Icon name="lock-reset" size={40} color="#fff" />
              </View>
              <Text style={styles.title}>Create New Password</Text>
              <Text style={styles.subtitle}>Enter your new password below</Text>
            </Animated.View>

            {/* New Password Input */}
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="New password"
                    placeholderTextColor="#64748b"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Confirm Password Input */}
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Icon name="lock-check-outline" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor="#64748b"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Reset Password Button */}
            <Animated.View entering={FadeInDown.delay(600).springify()}>
              <TouchableOpacity
                style={[styles.actionButton, (!newPassword || !confirmPassword || loading) && styles.actionButtonDisabled]}
                onPress={handleResetPassword}
                disabled={!newPassword || !confirmPassword || loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ef4444', '#dc2626']}
                  style={styles.gradientButton}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  {loading && <Icon name="loading" size={20} color="#fff" style={[styles.buttonIcon, { marginRight: 8 }]} />}
                  <Text style={styles.actionButtonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <ImageBackground source={IMAGES.AUTH_BACKGROUND} style={styles.background} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Gradient Overlay */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-left" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Progress Indicator */}
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((step === 'email' ? 1 : step === 'code' ? 2 : 3) / 3) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                Step {step === 'email' ? '1' : step === 'code' ? '2' : '3'} of 3
              </Text>
            </Animated.View>

            {/* Dynamic Step Content */}
            {renderStepContent()}

            {/* Footer */}
            <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.footer}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLinkText}>Sign In</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: width * 0.6,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 4,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 20,
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    width: width * 0.7,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  actionButton: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    // Additional icon styles if needed
  },
  backToEmailButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  backToEmailText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
  },
  footerLinkText: {
    color: '#3b82f6',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ResetPasswordScreen;