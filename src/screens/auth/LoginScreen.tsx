import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  useTheme,
  TouchableRipple
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface LoginScreenProps {
  onAuthSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onAuthSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = createStyles(theme);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      onAuthSuccess();
    }, 1500);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Image */}
      <View style={styles.headerImageContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop&crop=center' }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />
      </View>

      {/* Floating Brand Logo */}
      <Card style={styles.brandCard}>
        <View style={styles.brandLogoContainer}>
          <Icon name="school" size={32} color={theme.colors.primary} />
        </View>
      </Card>

      {/* Main Content Card */}
      <Card style={styles.authCard}>
        <Card.Content style={styles.cardContent}>
          {/* Welcome Text */}
          <Text variant="displaySmall" style={styles.welcomeText}>
            Welcome Back
          </Text>
          
          {/* Accent Line */}
          <View style={styles.accentLine} />
          
          {/* Subtitle */}
          <Text variant="bodyLarge" style={styles.subtitle}>
            Sign in to continue your journey
          </Text>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon={() => <Icon name="email" size={20} color={theme.colors.onSurfaceVariant} />} />}
              outlineStyle={styles.inputOutline}
              theme={{
                colors: {
                  onSurfaceVariant: theme.colors.onSurfaceVariant,
                  outline: theme.colors.outline,
                  primary: theme.colors.primary,
                }
              }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password"
              style={styles.input}
              left={<TextInput.Icon icon={() => <Icon name="lock" size={20} color={theme.colors.onSurfaceVariant} />} />}
              right={
                <TextInput.Icon
                  icon={() => <Icon name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={theme.colors.onSurfaceVariant} />}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
              outlineStyle={styles.inputOutline}
              theme={{
                colors: {
                  onSurfaceVariant: theme.colors.onSurfaceVariant,
                  outline: theme.colors.outline,
                  primary: theme.colors.primary,
                }
              }}
            />

            <TouchableRipple
              onPress={onSwitchToForgotPassword}
              style={styles.forgotPasswordContainer}
              borderless
            >
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            </TouchableRipple>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              labelStyle={styles.loginButtonLabel}
              icon={() => <Icon name="arrow-forward" size={20} color="#FFFFFF" />}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Link */}
          <Card style={styles.signUpCard}>
            <TouchableRipple
              onPress={onSwitchToRegister}
              style={styles.signUpTouchable}
            >
              <Text style={styles.signUpText}>
                Don't have account? Sign up
              </Text>
            </TouchableRipple>
          </Card>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      flexGrow: 1,
    },
    headerImageContainer: {
      height: 320,
      position: 'relative',
    },
    headerImage: {
      width: '100%',
      height: '100%',
    },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${theme.colors.primary}30`,
    },
    brandCard: {
      width: 88,
      height: 84,
      alignSelf: 'center',
      marginTop: -40,
      borderRadius: 24,
      elevation: 12,
      backgroundColor: theme.colors.surface,
      zIndex: 2,
    },
    brandLogoContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authCard: {
      marginTop: -20,
      marginHorizontal: 0,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      elevation: 12,
      backgroundColor: theme.colors.surface,
      minHeight: 500,
    },
    cardContent: {
      padding: 32,
      paddingTop: 56,
    },
    welcomeText: {
      color: theme.colors.onSurface,
      fontWeight: '900',
      letterSpacing: -0.5,
    },
    accentLine: {
      width: 60,
      height: 4,
      backgroundColor: theme.colors.primary,
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 2,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 40,
    },
    formContainer: {
      marginBottom: 32,
    },
    input: {
      marginBottom: 20,
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderWidth: 2,
      borderRadius: 16,
    },
    forgotPasswordContainer: {
      alignSelf: 'flex-end',
      padding: 12,
      marginBottom: 32,
      borderRadius: 8,
    },
    forgotPasswordText: {
      color: theme.colors.primary,
      fontWeight: '600',
      fontSize: 15,
    },
    loginButton: {
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      elevation: 8,
    },
    loginButtonLabel: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    buttonContent: {
      height: 64,
      flexDirection: 'row-reverse',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 32,
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
      fontSize: 13,
      fontWeight: '500',
    },
    signUpCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 16,
      elevation: 0,
    },
    signUpTouchable: {
      padding: 18,
      borderRadius: 16,
    },
    signUpText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: '500',
    },
  });
export default LoginScreen;