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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onBackToLogin,
}) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const styles = createStyles(theme);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setEmailSent(true);
    }, 1500);
  };

  const handleResendEmail = () => {
    setEmailSent(false);
    handleResetPassword();
  };

  if (emailSent) {
    return (
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Image */}
        <View style={styles.headerImageContainer}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop&crop=center' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay} />
        </View>

        {/* Floating Brand Logo */}
        <Card style={styles.brandCard}>
          <View style={styles.brandLogoContainer}>
            <MaterialCommunityIcons name="email-check" size={32} color={theme.colors.primary} />
          </View>
        </Card>

        {/* Main Content Card */}
        <Card style={styles.authCard}>
          <Card.Content style={styles.cardContent}>
            {/* Success Header */}
            <View style={styles.successIconContainer}>
              <Icon name="check-circle" size={64} color={theme.colors.primary} />
            </View>
            
            <Text variant="displaySmall" style={styles.successTitle}>
              Check Your Email
            </Text>
            
            <Text variant="bodyLarge" style={styles.successSubtitle}>
              We've sent a password reset link to
            </Text>
            <Text variant="bodyLarge" style={styles.emailText}>
              {email}
            </Text>

            {/* Instructions */}
            <View style={styles.instructionsContainer}>
              <Text variant="bodyMedium" style={styles.instructionsText}>
                Click the link in the email to reset your password. If you don't see the email, check your spam folder.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsContainer}>
              <Button
                mode="outlined"
                onPress={handleResendEmail}
                style={styles.resendButton}
                labelStyle={styles.resendButtonLabel}
                icon={() => <Icon name="refresh" size={20} color={theme.colors.primary} />}
              >
                Resend Email
              </Button>

              <Button
                mode="contained"
                onPress={onBackToLogin}
                style={styles.backButton}
                labelStyle={styles.backButtonLabel}
                icon={() => <Icon name="arrow-back" size={20} color="#FFFFFF" />}
                contentStyle={styles.buttonContent}
              >
                Back to Sign In
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Image */}
      <View style={styles.headerImageContainer}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop&crop=center' }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />
      </View>

      {/* Floating Brand Logo */}
      <Card style={styles.brandCard}>
        <View style={styles.brandLogoContainer}>
          <MaterialCommunityIcons name="email-check" size={32} color={theme.colors.primary} />
        </View>
      </Card>

      {/* Main Content Card */}
      <Card style={styles.authCard}>
        <Card.Content style={styles.cardContent}>
          {/* Header */}
          <Text variant="displaySmall" style={styles.titleText}>
            Reset Password
          </Text>
          
          {/* Accent Line */}
          <View style={styles.accentLine} />
          
          {/* Subtitle */}
          <Text variant="bodyLarge" style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>

          {/* Reset Form */}
          <View style={styles.formContainer}>
            <TextInput
              label="Email Address"
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

            <Button
              mode="contained"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.resetButton}
              labelStyle={styles.resetButtonLabel}
              icon={() => <Icon name="send" size={20} color="#FFFFFF" />}
              contentStyle={styles.buttonContent}
            >
              Send Reset Link
            </Button>
          </View>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <TouchableRipple
              onPress={onBackToLogin}
              style={styles.backLinkContainer}
              borderless
            >
              <View style={styles.backLinkContent}>
                <Icon name="arrow-back" size={20} color={theme.colors.primary} />
                <Text style={styles.backLinkText}>Back to Sign In</Text>
              </View>
            </TouchableRipple>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text variant="bodySmall" style={styles.helpText}>
              Remember your password? Try signing in again or contact support if you need help.
            </Text>
          </View>
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
    titleText: {
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
      lineHeight: 24,
    },
    formContainer: {
      marginBottom: 32,
    },
    input: {
      marginBottom: 24,
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderWidth: 2,
      borderRadius: 16,
    },
    resetButton: {
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      elevation: 8,
    },
    resetButtonLabel: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
    buttonContent: {
      height: 64,
      flexDirection: 'row-reverse',
    },
    backContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    backLinkContainer: {
      padding: 12,
      borderRadius: 8,
    },
    backLinkContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backLinkText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    helpContainer: {
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    helpText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      opacity: 0.7,
      lineHeight: 18,
    },
    // Success state styles
    successIconContainer: {
      alignItems: 'center',
      marginBottom: 24,
    },
    successTitle: {
      color: theme.colors.onSurface,
      fontWeight: '900',
      textAlign: 'center',
      marginBottom: 16,
      letterSpacing: -0.5,
    },
    successSubtitle: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 4,
    },
    emailText: {
      color: theme.colors.primary,
      textAlign: 'center',
      fontWeight: '600',
      marginBottom: 32,
    },
    instructionsContainer: {
      marginBottom: 32,
      paddingHorizontal: 8,
    },
    instructionsText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
      opacity: 0.9,
    },
    actionsContainer: {
      gap: 16,
    },
    resendButton: {
      height: 56,
      borderRadius: 16,
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    resendButtonLabel: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
    backButton: {
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      elevation: 8,
    },
    backButtonLabel: {
      color: '#FFFFFF',
      fontSize: 17,
      fontWeight: '900',
      letterSpacing: 0.5,
    },
  });

export default ForgotPasswordScreen;