import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Image, 
  Animated, 
  Dimensions,
  StatusBar 
} from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  useTheme,
  TouchableRipple,
  Surface,
  Chip
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface CreativeLoginScreenProps {
  onAuthSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

const CreativeLoginScreen: React.FC<CreativeLoginScreenProps> = ({
  onAuthSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const styles = createStyles(theme);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (response.ok) {
        setTimeout(() => {
          setLoading(false);
          onAuthSuccess();
        }, 1000);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Invalid email or password');
    }
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.container}>
        {/* Animated Background */}
        <View style={styles.backgroundContainer}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.tertiary]}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          
          {/* Floating Elements */}
          <Animated.View
            style={[
              styles.floatingElement,
              styles.element1,
              { transform: [{ rotate: rotation }] }
            ]}
          />
          <Animated.View
            style={[
              styles.floatingElement,
              styles.element2,
              { transform: [{ rotate: rotation }] }
            ]}
          />
          <Animated.View
            style={[
              styles.floatingElement,
              styles.element3,
              { transform: [{ rotate: rotation }] }
            ]}
          />
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Surface style={styles.logoSurface} elevation={5}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8FAFC']}
                  style={styles.logoGradient}
                >
                  <Icon name="school" size={40} color={theme.colors.primary} />
                </LinearGradient>
              </Surface>
            </View>
            
            <Text variant="displayMedium" style={styles.welcomeTitle}>
              Welcome Back
            </Text>
            <Text variant="bodyLarge" style={styles.welcomeSubtitle}>
              Sign in to continue your academic journey
            </Text>
          </Animated.View>

          {/* Login Form Card */}
          <Animated.View
            style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Surface style={styles.formSurface} elevation={8}>
              <View style={styles.formContent}>
                {/* Quick Login Options */}
                <View style={styles.quickLoginContainer}>
                  <Text variant="labelMedium" style={styles.quickLoginLabel}>
                    Quick Login
                  </Text>
                  <View style={styles.quickLoginChips}>
                    <Chip
                      icon={() => <Icon name="person" size={16} color={theme.colors.primary} />}
                      onPress={() => {
                        setEmail('student@campus.edu');
                        setPassword('demo123');
                      }}
                      style={styles.quickChip}
                      textStyle={styles.quickChipText}
                    >
                      Student
                    </Chip>
                    <Chip
                      icon={() => <Icon name="school" size={16} color={theme.colors.secondary} />}
                      onPress={() => {
                        setEmail('faculty@campus.edu');
                        setPassword('demo123');
                      }}
                      style={[styles.quickChip, { backgroundColor: `${theme.colors.secondary}20` }]}
                      textStyle={styles.quickChipText}
                    >
                      Faculty
                    </Chip>
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <Icon name="email" size={20} color={theme.colors.primary} />} />}
                    theme={{
                      colors: {
                        primary: theme.colors.primary,
                        outline: theme.colors.outline,
                      }
                    }}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <Icon name="lock" size={20} color={theme.colors.primary} />} />}
                    right={
                      <TextInput.Icon
                        icon={() => <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={theme.colors.onSurfaceVariant} />}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                    theme={{
                      colors: {
                        primary: theme.colors.primary,
                        outline: theme.colors.outline,
                      }
                    }}
                  />
                </View>

                {/* Remember Me & Forgot Password */}
                <View style={styles.optionsRow}>
                  <TouchableRipple
                    onPress={() => setRememberMe(!rememberMe)}
                    style={styles.rememberMeContainer}
                  >
                    <View style={styles.rememberMeContent}>
                      <Icon 
                        name={rememberMe ? 'check-box' : 'check-box-outline-blank'} 
                        size={20} 
                        color={theme.colors.primary} 
                      />
                      <Text style={styles.rememberMeText}>Remember me</Text>
                    </View>
                  </TouchableRipple>

                  <TouchableRipple
                    onPress={onSwitchToForgotPassword}
                    style={styles.forgotPasswordContainer}
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableRipple>
                </View>

                {/* Login Button */}
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.loginButton}
                  labelStyle={styles.loginButtonLabel}
                  contentStyle={styles.loginButtonContent}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                {/* Social Login */}
                <View style={styles.socialContainer}>
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialButtons}>
                    <TouchableRipple
                      onPress={() => Alert.alert('Google Login', 'Coming soon!')}
                      style={styles.socialButton}
                    >
                      <View style={styles.socialButtonContent}>
                        <Icon name="google" size={24} color="#DB4437" />
                      </View>
                    </TouchableRipple>

                    <TouchableRipple
                      onPress={() => Alert.alert('Microsoft Login', 'Coming soon!')}
                      style={styles.socialButton}
                    >
                      <View style={styles.socialButtonContent}>
                        <Icon name="microsoft" size={24} color="#0078D4" />
                      </View>
                    </TouchableRipple>

                    <TouchableRipple
                      onPress={() => Alert.alert('Apple Login', 'Coming soon!')}
                      style={styles.socialButton}
                    >
                      <View style={styles.socialButtonContent}>
                        <Icon name="apple" size={24} color="#000000" />
                      </View>
                    </TouchableRipple>
                  </View>
                </View>
              </View>
            </Surface>
          </Animated.View>

          {/* Register Link */}
          <Animated.View
            style={[
              styles.registerContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Surface style={styles.registerSurface} elevation={2}>
              <TouchableRipple
                onPress={onSwitchToRegister}
                style={styles.registerTouchable}
              >
                <View style={styles.registerContent}>
                  <Text style={styles.registerText}>
                    Don't have an account?{' '}
                    <Text style={styles.registerLink}>Sign up here</Text>
                  </Text>
                  <Icon name="arrow-forward" size={20} color={theme.colors.primary} />
                </View>
              </TouchableRipple>
            </Surface>
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    backgroundContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    gradientBackground: {
      flex: 1,
    },
    floatingElement: {
      position: 'absolute',
      borderRadius: 100,
      opacity: 0.1,
    },
    element1: {
      width: 200,
      height: 200,
      backgroundColor: '#FFFFFF',
      top: height * 0.1,
      right: -100,
    },
    element2: {
      width: 150,
      height: 150,
      backgroundColor: '#FFFFFF',
      bottom: height * 0.2,
      left: -75,
    },
    element3: {
      width: 100,
      height: 100,
      backgroundColor: '#FFFFFF',
      top: height * 0.6,
      right: width * 0.1,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },
    headerSection: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logoContainer: {
      marginBottom: 24,
    },
    logoSurface: {
      borderRadius: 30,
      overflow: 'hidden',
    },
    logoGradient: {
      width: 80,
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeTitle: {
      color: '#FFFFFF',
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    welcomeSubtitle: {
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.9,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    formContainer: {
      marginBottom: 24,
    },
    formSurface: {
      borderRadius: 24,
      backgroundColor: theme.colors.surface,
    },
    formContent: {
      padding: 32,
    },
    quickLoginContainer: {
      marginBottom: 32,
    },
    quickLoginLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
      textAlign: 'center',
      fontWeight: '600',
    },
    quickLoginChips: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    quickChip: {
      backgroundColor: `${theme.colors.primary}20`,
    },
    quickChipText: {
      color: theme.colors.primary,
      fontWeight: '500',
    },
    inputContainer: {
      marginBottom: 20,
    },
    input: {
      backgroundColor: theme.colors.surface,
    },
    optionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 32,
    },
    rememberMeContainer: {
      borderRadius: 8,
      padding: 8,
    },
    rememberMeContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rememberMeText: {
      marginLeft: 8,
      color: theme.colors.onSurface,
      fontSize: 14,
    },
    forgotPasswordContainer: {
      borderRadius: 8,
      padding: 8,
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 14,
    },
    loginButton: {
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      elevation: 8,
      marginBottom: 32,
    },
    loginButtonLabel: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    loginButtonContent: {
      height: 56,
    },
    socialContainer: {
      alignItems: 'center',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.outline,
      opacity: 0.3,
    },
    dividerText: {
      marginHorizontal: 16,
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      fontWeight: '500',
    },
    socialButtons: {
      flexDirection: 'row',
      gap: 16,
    },
    socialButton: {
      borderRadius: 20,
    },
    socialButtonContent: {
      width: 60,
      height: 60,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      elevation: 4,
    },
    registerContainer: {
      alignItems: 'center',
    },
    registerSurface: {
      borderRadius: 16,
      backgroundColor: `${theme.colors.surface}95`,
      width: '100%',
    },
    registerTouchable: {
      borderRadius: 16,
    },
    registerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    registerText: {
      color: theme.colors.onSurface,
      fontSize: 15,
      marginRight: 8,
    },
    registerLink: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });

export default CreativeLoginScreen;