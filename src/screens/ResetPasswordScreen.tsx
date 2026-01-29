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
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';
import { IMAGES } from '../config/images';
import axios from 'axios';

const { width } = Dimensions.get('window');

const ResetPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!token || !newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please enter both the token and new password.',
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
      await axios.post('/api/v1/auth/password/reset/confirm', {
        token,
        new_password: newPassword,
      });
      Toast.show({
        type: 'success',
        text1: 'Password Reset!',
        text2: 'You can now log in with your new password.',
      });
      setToken('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigation.navigate('Login'), 1500);
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: err?.response?.data?.detail || 'Could not reset password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={IMAGES.AUTH_BACKGROUND} style={styles.background} resizeMode="cover">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Gradient Overlay */}
      <View style={styles.overlay} />

      {/* Animated Glow Effect */}
      <View style={styles.glowContainer}>
        <View style={[styles.glowCircle, styles.glow1]} />
        <View style={[styles.glowCircle, styles.glow2]} />
      </View>

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

            {/* Header */}
            <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#3b82f6', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconCircle}
                >
                  <Icon name="shield-key" size={42} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Secure Reset</Text>
              <Text style={styles.subtitle}>
                Enter your token and choose a strong new password
              </Text>
            </Animated.View>

          {/* Form Container with Glass Morphism */}
          <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.formWrapper}>
            <View style={styles.glassCard}>
              {/* Token Input */}
              <Animated.View entering={SlideInRight.delay(400).springify()}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Icon name="key-variant" size={18} color="#3b82f6" />
                    <Text style={styles.label}>Reset Token</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={token}
                      onChangeText={setToken}
                      placeholder="Paste token from your email"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              </Animated.View>

              {/* Password Input */}
              <Animated.View entering={SlideInRight.delay(500).springify()}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Icon name="lock-outline" size={18} color="#3b82f6" />
                    <Text style={styles.label}>New Password</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeIcon}
                    >
                      <Icon
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                  {newPassword.length > 0 && (
                    <View style={styles.strengthIndicator}>
                      <View
                        style={[
                          styles.strengthBar,
                          {
                            width:
                              newPassword.length < 8
                                ? '33%'
                                : newPassword.length < 12
                                ? '66%'
                                : '100%',
                            backgroundColor:
                              newPassword.length < 8
                                ? '#ef4444'
                                : newPassword.length < 12
                                ? '#f59e0b'
                                : '#10b981',
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Confirm Password Input */}
              <Animated.View entering={SlideInRight.delay(600).springify()}>
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Icon name="lock-check" size={18} color="#3b82f6" />
                    <Text style={styles.label}>Confirm Password</Text>
                  </View>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter new password"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Icon
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={22}
                        color="rgba(255,255,255,0.6)"
                      />
                    </TouchableOpacity>
                  </View>
                  {confirmPassword.length > 0 && (
                    <View style={styles.matchIndicator}>
                      <Icon
                        name={
                          newPassword === confirmPassword
                            ? 'check-circle'
                            : 'close-circle'
                        }
                        size={16}
                        color={
                          newPassword === confirmPassword ? '#10b981' : '#ef4444'
                        }
                      />
                      <Text
                        style={[
                          styles.matchText,
                          {
                            color:
                              newPassword === confirmPassword
                                ? '#10b981'
                                : '#ef4444',
                          },
                        ]}
                      >
                        {newPassword === confirmPassword
                          ? 'Passwords match'
                          : 'Passwords do not match'}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Requirements */}
              <Animated.View entering={FadeIn.delay(700).duration(600)}>
                <View style={styles.requirementsBox}>
                  <Text style={styles.requirementsTitle}>Password must contain:</Text>
                  <View style={styles.requirement}>
                    <Icon
                      name={newPassword.length >= 8 ? 'check-circle' : 'circle-outline'}
                      size={16}
                      color={newPassword.length >= 8 ? '#10b981' : 'rgba(255,255,255,0.4)'}
                    />
                    <Text style={styles.requirementText}>At least 8 characters</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Reset Button */}
              <Animated.View entering={FadeInDown.delay(800).springify()}>
                <TouchableOpacity
                  style={[
                    styles.resetButton,
                    (!token || !newPassword || !confirmPassword || loading) &&
                      styles.resetButtonDisabled,
                  ]}
                  onPress={handleReset}
                  disabled={!token || !newPassword || !confirmPassword || loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#8b5cf6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <Icon name="loading" size={24} color="#fff" style={styles.loadingIcon} />
                    ) : (
                      <Icon name="shield-check" size={24} color="#fff" style={{ marginRight: 8 }} />
                    )}
                    <Text style={styles.buttonText}>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(900).duration(600)} style={styles.footer}>
            <Icon name="shield-alert" size={16} color="rgba(255,255,255,0.5)" />
            <Text style={styles.footerText}>
              Token expires in 1 hour • Keep it secure
            </Text>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 8, 22, 0.92)',
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
  },
  glow1: {
    backgroundColor: '#3b82f6',
    top: -100,
    right: -50,
  },
  glow2: {
    backgroundColor: '#8b5cf6',
    bottom: -100,
    left: -50,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 100,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  formWrapper: {
    width: '100%',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  strengthIndicator: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  matchText: {
    fontSize: 13,
    fontWeight: '500',
  },
  requirementsBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  resetButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  resetButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.2,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  loadingIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
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
});

export default ResetPasswordScreen;