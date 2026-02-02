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
  Dimensions
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';

import { IMAGES } from '../../config/images';
import CustomInput from '../../components/common/CustomInput';

const BACKGROUND_IMAGE = IMAGES.AUTH_BACKGROUND;

const ForgotPasswordScreen = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      Toast.show({
        type: 'success',
        text1: 'Reset Code Sent',
        text2: 'Check your email for the 5-character code.',
      });
      setTimeout(() => navigation.goBack(), 1200);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Reset Failed',
        text2: error?.message || 'Could not send reset email',
      });
    } finally {
      setLoading(false);
    }
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

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>

          {/* Header */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.header}>
            <View style={styles.iconCircle}>
              <Icon name="lock-reset" size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a 5-character reset code.</Text>
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

            {/* Send Link Button */}
            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <TouchableOpacity
                style={[styles.loginBtn, (!email || loading) && styles.loginBtnDisabled]}
                activeOpacity={0.8}
                onPress={handleResetPassword}
                disabled={loading || !email}
              >
                <View style={styles.btnGradient} />
                {loading ? (
                  <Icon name="loading" size={22} color="#fff" style={{ marginRight: 6 }} />
                ) : null}
                <Text style={styles.loginBtnText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Divider */}
            <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </Animated.View>

            {/* Token Button */}
            <Animated.View entering={FadeInDown.delay(700).springify()}>
              <TouchableOpacity
                style={styles.tokenBtn}
                onPress={() => navigation.navigate('ResetPassword')}
                activeOpacity={0.85}
              >
                <View style={styles.tokenBtnContent}>
                  <Icon name="key-variant" size={22} color="#3b82f6" />
                  <Text style={styles.tokenBtnText}>I have a reset code</Text>
                  <Icon name="arrow-right" size={20} color="#3b82f6" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.footer}>
            <Text style={styles.footerText}>Remembered it? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.signupText}>Log In</Text>
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
    backgroundColor: 'rgba(10, 10, 20, 0.85)',
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 10,
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
    paddingHorizontal: 20,
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
    backgroundColor: '#EC4899',
    shadowColor: "#EC4899",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  loginBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0.2,
  },
  btnGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EC4899',
    opacity: 0.9,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 16,
    letterSpacing: 1,
  },
  tokenBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tokenBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tokenBtnText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
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

export default ForgotPasswordScreen;