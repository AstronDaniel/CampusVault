import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme, Surface, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const { width, height } = Dimensions.get('window');

const ChangePasswordScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;

  // Form state
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const currentPasswordRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    let strength = 0;

    if (password.length >= 8) strength += 1;
    else errors.push('At least 8 characters');

    if (/[A-Z]/.test(password)) strength += 1;
    else errors.push('One uppercase letter');

    if (/[a-z]/.test(password)) strength += 1;
    else errors.push('One lowercase letter');

    if (/[0-9]/.test(password)) strength += 1;
    else errors.push('One number');

    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    else errors.push('One special character');

    setPasswordStrength(strength);
    setPasswordErrors(errors);
    return strength >= 3; // Require at least 3 out of 5 criteria
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return '#6B7280';
    if (passwordStrength <= 2) return '#EF4444';
    if (passwordStrength <= 3) return '#F59E0B';
    if (passwordStrength === 4) return '#10B981';
    return '#059669'; // 5
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'Too weak';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength === 4) return 'Good';
    return 'Strong';
  };

  const handleChangePassword = async () => {
    // Validation
    if (!form.currentPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Current password required',
        text2: 'Please enter your current password',
      });
      return;
    }

    if (!form.newPassword.trim()) {
      Toast.show({
        type: 'error',
        text1: 'New password required',
        text2: 'Please enter a new password',
      });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        text2: 'New password and confirmation must match',
      });
      return;
    }

    if (passwordStrength < 3) {
      Toast.show({
        type: 'error',
        text1: 'Weak password',
        text2: 'Please choose a stronger password',
      });
      return;
    }

    if (form.currentPassword === form.newPassword) {
      Toast.show({
        type: 'error',
        text1: 'Same password',
        text2: 'New password must be different from current',
      });
      return;
    }

    Alert.alert(
      'Change Password',
      'Are you sure you want to change your password?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Change Password',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Call the change password API
              // Note: You'll need to add changePassword method to authService
              // await authService.changePassword(form.currentPassword, form.newPassword);
              
              // Simulate API call
              await new Promise<void>(resolve => setTimeout(resolve, 1500));
              
              Toast.show({
                type: 'success',
                text1: 'Password Changed',
                text2: 'Your password has been updated successfully',
              });
              
              // Reset form
              setForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              });
              
              // Navigate back after delay
              setTimeout(() => {
                navigation.goBack();
              }, 1500);
              
            } catch (error: any) {
              console.error('[ChangePassword] Error:', error);
              Toast.show({
                type: 'error',
                text1: 'Password Change Failed',
                text2: error.response?.data?.detail || error.message || 'Please try again',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
      </TouchableOpacity>
      <View style={styles.headerTitle}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          Change Password
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.outline }]}>
          Secure your account
        </Text>
      </View>
    </Animated.View>
  );

  const renderCurrentPasswordField = () => (
    <Animated.View entering={SlideInRight.delay(200)}>
      <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>
        CURRENT PASSWORD
      </Text>
      <Surface style={[styles.inputContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={styles.inputWrapper}>
          <Icon name="lock-outline" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            ref={currentPasswordRef}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827' }]}
            placeholder="Enter current password"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={form.currentPassword}
            onChangeText={(text) => setForm({ ...form, currentPassword: text })}
            secureTextEntry={!showCurrentPassword}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => newPasswordRef.current?.focus()}
          />
          <TouchableOpacity
            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            style={styles.eyeButton}
          >
            <Icon
              name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.outline}
            />
          </TouchableOpacity>
        </View>
      </Surface>
    </Animated.View>
  );

  const renderNewPasswordField = () => (
    <Animated.View entering={SlideInRight.delay(250)}>
      <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>
        NEW PASSWORD
      </Text>
      <Surface style={[styles.inputContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={styles.inputWrapper}>
          <Icon name="lock-plus-outline" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            ref={newPasswordRef}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827' }]}
            placeholder="Create new password"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={form.newPassword}
            onChangeText={(text) => {
              setForm({ ...form, newPassword: text });
              validatePassword(text);
            }}
            secureTextEntry={!showNewPassword}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(!showNewPassword)}
            style={styles.eyeButton}
          >
            <Icon
              name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.outline}
            />
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Password Strength Indicator */}
      {form.newPassword.length > 0 && (
        <View style={styles.passwordStrengthContainer}>
          <View style={styles.passwordStrengthHeader}>
            <Text style={[styles.passwordStrengthLabel, { color: theme.colors.outline }]}>
              Password Strength:
            </Text>
            <Text style={[styles.passwordStrengthValue, { color: getPasswordStrengthColor() }]}>
              {getPasswordStrengthText()}
            </Text>
          </View>
          
          <View style={styles.strengthBarContainer}>
            {[1, 2, 3, 4, 5].map((index) => (
              <View
                key={index}
                style={[
                  styles.strengthBar,
                  { backgroundColor: index <= passwordStrength ? getPasswordStrengthColor() : isDark ? '#2A2A2A' : '#E5E7EB' },
                ]}
              />
            ))}
          </View>

          {/* Password Requirements */}
          {passwordErrors.length > 0 && (
            <View style={styles.passwordRequirements}>
              <Text style={[styles.requirementsTitle, { color: theme.colors.outline }]}>
                Requirements:
              </Text>
              {passwordErrors.map((error, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Icon
                    name="close-circle"
                    size={14}
                    color={theme.colors.error}
                    style={styles.requirementIcon}
                  />
                  <Text style={[styles.requirementText, { color: theme.colors.outline }]}>
                    {error}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );

  const renderConfirmPasswordField = () => (
    <Animated.View entering={SlideInRight.delay(300)}>
      <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>
        CONFIRM NEW PASSWORD
      </Text>
      <Surface style={[styles.inputContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={styles.inputWrapper}>
          <Icon name="lock-check-outline" size={20} color={theme.colors.outline} style={styles.inputIcon} />
          <TextInput
            ref={confirmPasswordRef}
            style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827' }]}
            placeholder="Confirm new password"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={form.confirmPassword}
            onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleChangePassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeButton}
          >
            <Icon
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.outline}
            />
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Password Match Indicator */}
      {form.confirmPassword.length > 0 && (
        <View style={styles.passwordMatchContainer}>
          <Icon
            name={form.newPassword === form.confirmPassword ? 'check-circle' : 'close-circle'}
            size={16}
            color={form.newPassword === form.confirmPassword ? '#10B981' : theme.colors.error}
            style={styles.matchIcon}
          />
          <Text style={[
            styles.matchText,
            { color: form.newPassword === form.confirmPassword ? '#10B981' : theme.colors.error }
          ]}>
            {form.newPassword === form.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderSecurityTips = () => (
    <Animated.View entering={SlideInRight.delay(350)}>
      <Text style={[styles.tipsTitle, { color: theme.colors.outline }]}>
        <Icon name="shield-check" size={16} color={theme.colors.primary} /> SECURITY TIPS
      </Text>
      <Surface style={[styles.tipsCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#10B981" />
          <Text style={[styles.tipText, { color: isDark ? '#D1D5DB' : '#6B7280' }]}>
            Use a unique password not used elsewhere
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#10B981" />
          <Text style={[styles.tipText, { color: isDark ? '#D1D5DB' : '#6B7280' }]}>
            Minimum 8 characters with mix of letters, numbers, symbols
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#10B981" />
          <Text style={[styles.tipText, { color: isDark ? '#D1D5DB' : '#6B7280' }]}>
            Avoid personal information like name or birthday
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Icon name="check-circle" size={16} color="#10B981" />
          <Text style={[styles.tipText, { color: isDark ? '#D1D5DB' : '#6B7280' }]}>
            Consider using a password manager
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Section */}
        <Animated.View entering={FadeInUp.delay(150)} style={styles.heroSection}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name="lock-reset" size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            Update Your Password
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.outline }]}>
            Enter your current password and create a new secure password
          </Text>
        </Animated.View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {renderCurrentPasswordField()}
          {renderNewPasswordField()}
          {renderConfirmPasswordField()}
          {renderSecurityTips()}
        </View>

        {/* Action Buttons */}
        <Animated.View entering={SlideInRight.delay(400)} style={styles.actionsSection}>
          <Button
            mode="contained"
            onPress={handleChangePassword}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
            icon="lock-check"
          >
            {loading ? 'Updating Password...' : 'Change Password'}
          </Button>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={[styles.cancelText, { color: theme.colors.outline }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  formSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    padding: 8,
  },
  passwordStrengthContainer: {
    marginBottom: 16,
  },
  passwordStrengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordStrengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  passwordStrengthValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  passwordRequirements: {
    marginTop: 8,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementIcon: {
    marginRight: 6,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '500',
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  matchIcon: {
    marginRight: 6,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipsTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
    marginLeft: 4,
  },
  tipsCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginLeft: 10,
  },
  actionsSection: {
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 16,
    elevation: 4,
  },
  submitButtonContent: {
    height: 56,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancelButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ChangePasswordScreen;