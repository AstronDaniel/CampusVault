import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  useTheme,
  TouchableRipple,
  Menu,
  Divider
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RegisterScreenProps {
  onAuthSuccess: () => void;
  onSwitchToLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onAuthSuccess,
  onSwitchToLogin,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    faculty: '',
    program: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [facultyMenuVisible, setFacultyMenuVisible] = useState(false);
  const [programMenuVisible, setProgramMenuVisible] = useState(false);

  const faculties = [
    'Faculty of Engineering',
    'Faculty of Science',
    'Faculty of Arts',
    'Faculty of Business',
    'Faculty of Medicine',
    'Faculty of Law',
  ];

  const programs = {
    'Faculty of Engineering': ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'],
    'Faculty of Science': ['Mathematics', 'Physics', 'Chemistry', 'Biology'],
    'Faculty of Arts': ['English Literature', 'History', 'Philosophy', 'Fine Arts'],
    'Faculty of Business': ['Business Administration', 'Accounting', 'Marketing', 'Finance'],
    'Faculty of Medicine': ['Medicine', 'Nursing', 'Pharmacy', 'Dentistry'],
    'Faculty of Law': ['Law', 'Legal Studies', 'International Law'],
  };

  const styles = createStyles(theme);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Reset program when faculty changes
      if (field === 'faculty') {
        newData.program = '';
      }
      return newData;
    });
  };

  const validateForm = () => {
    const { name, email, faculty, program, password, confirmPassword } = formData;
    
    if (!name || !email || !faculty || !program || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success', 
        'Account created successfully!',
        [{ text: 'OK', onPress: onAuthSuccess }]
      );
    }, 2000);
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
          source={{ uri: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop&crop=center' }}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay} />
      </View>

      {/* Floating Brand Logo */}
      <Card style={styles.brandCard}>
        <View style={styles.brandLogoContainer}>
          <Icon name="person-add" size={32} color={theme.colors.secondary} />
        </View>
      </Card>

      {/* Main Content Card */}
      <Card style={styles.authCard}>
        <Card.Content style={styles.cardContent}>
          {/* Title */}
          <Text variant="displaySmall" style={styles.titleText}>
            Create Account
          </Text>
          
          {/* Accent Line */}
          <View style={styles.accentLine} />
          
          {/* Subtitle */}
          <Text variant="bodyLarge" style={styles.subtitle}>
            Start your journey with us
          </Text>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <TextInput
              label="Full Name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              mode="outlined"
              autoCapitalize="words"
              style={styles.input}
              left={<TextInput.Icon icon={() => <Icon name="person" size={20} color={theme.colors.onSurfaceVariant} />} />}
              outlineStyle={styles.inputOutline}
              theme={{
                colors: {
                  onSurfaceVariant: theme.colors.onSurfaceVariant,
                  outline: theme.colors.outline,
                  primary: theme.colors.secondary,
                }
              }}
            />

            <TextInput
              label="Email Address"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
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
                  primary: theme.colors.secondary,
                }
              }}
            />

            {/* Faculty Dropdown */}
            <Menu
              visible={facultyMenuVisible}
              onDismiss={() => setFacultyMenuVisible(false)}
              anchor={
                <TouchableRipple
                  onPress={() => setFacultyMenuVisible(true)}
                  style={styles.dropdownTouchable}
                >
                  <View style={styles.dropdownContainer}>
                    <View style={styles.dropdownIconContainer}>
                      <Icon name="school" size={20} color={theme.colors.onSurfaceVariant} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownLabel}>Faculty</Text>
                      <Text style={styles.dropdownValue}>
                        {formData.faculty || 'Select faculty'}
                      </Text>
                    </View>
                    <Icon name="arrow-drop-down" size={24} color={theme.colors.onSurfaceVariant} />
                  </View>
                </TouchableRipple>
              }
              contentStyle={styles.menuContent}
            >
              {faculties.map((faculty) => (
                <Menu.Item
                  key={faculty}
                  onPress={() => {
                    updateFormData('faculty', faculty);
                    setFacultyMenuVisible(false);
                  }}
                  title={faculty}
                  titleStyle={styles.menuItemTitle}
                />
              ))}
            </Menu>

            {/* Program Dropdown */}
            <Menu
              visible={programMenuVisible}
              onDismiss={() => setProgramMenuVisible(false)}
              anchor={
                <TouchableRipple
                  onPress={() => {
                    if (formData.faculty) {
                      setProgramMenuVisible(true);
                    } else {
                      Alert.alert('Info', 'Please select a faculty first');
                    }
                  }}
                  style={[styles.dropdownTouchable, !formData.faculty && styles.dropdownDisabled]}
                >
                  <View style={styles.dropdownContainer}>
                    <View style={styles.dropdownIconContainer}>
                      <Icon name="menu-book" size={20} color={theme.colors.onSurfaceVariant} />
                    </View>
                    <View style={styles.dropdownTextContainer}>
                      <Text style={styles.dropdownLabel}>Program</Text>
                      <Text style={[styles.dropdownValue, !formData.faculty && styles.dropdownValueDisabled]}>
                        {formData.program || 'Select program'}
                      </Text>
                    </View>
                    <Icon name="arrow-drop-down" size={24} color={theme.colors.onSurfaceVariant} />
                  </View>
                </TouchableRipple>
              }
              contentStyle={styles.menuContent}
            >
              {formData.faculty && programs[formData.faculty as keyof typeof programs]?.map((program) => (
                <Menu.Item
                  key={program}
                  onPress={() => {
                    updateFormData('program', program);
                    setProgramMenuVisible(false);
                  }}
                  title={program}
                  titleStyle={styles.menuItemTitle}
                />
              ))}
            </Menu>

            <TextInput
              label="Password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              mode="outlined"
              secureTextEntry={!showPassword}
              autoComplete="password-new"
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
                  primary: theme.colors.secondary,
                }
              }}
            />

            <TextInput
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              mode="outlined"
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              style={styles.input}
              left={<TextInput.Icon icon={() => <Icon name="lock-outline" size={20} color={theme.colors.onSurfaceVariant} />} />}
              right={
                <TextInput.Icon
                  icon={() => <Icon name={showConfirmPassword ? 'visibility-off' : 'visibility'} size={20} color={theme.colors.onSurfaceVariant} />}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
              outlineStyle={styles.inputOutline}
              theme={{
                colors: {
                  onSurfaceVariant: theme.colors.onSurfaceVariant,
                  outline: theme.colors.outline,
                  primary: theme.colors.secondary,
                }
              }}
            />

            <Button
              mode="contained"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              labelStyle={styles.registerButtonLabel}
              icon={() => <Icon name="arrow-forward" size={20} color="#FFFFFF" />}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign In Link */}
          <Card style={styles.signInCard}>
            <TouchableRipple
              onPress={onSwitchToLogin}
              style={styles.signInTouchable}
            >
              <Text style={styles.signInText}>
                Already have an account? Sign in
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
      backgroundColor: `${theme.colors.secondary}30`,
    },
    brandCard: {
      width: 80,
      height: 80,
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
      minHeight: 600,
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
      backgroundColor: theme.colors.secondary,
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
      marginBottom: 18,
      backgroundColor: theme.colors.surface,
    },
    inputOutline: {
      borderWidth: 2,
      borderRadius: 16,
    },
    dropdownTouchable: {
      marginBottom: 18,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    dropdownDisabled: {
      opacity: 0.6,
    },
    dropdownContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      minHeight: 56,
    },
    dropdownIconContainer: {
      marginRight: 12,
    },
    dropdownTextContainer: {
      flex: 1,
    },
    dropdownLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    dropdownValue: {
      fontSize: 16,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    dropdownValueDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
    menuContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      elevation: 8,
      maxHeight: 200,
    },
    menuItemTitle: {
      color: theme.colors.onSurface,
    },
    registerButton: {
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.colors.secondary,
      elevation: 8,
      marginTop: 32,
    },
    registerButtonLabel: {
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
    signInCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 16,
      elevation: 0,
    },
    signInTouchable: {
      padding: 18,
      borderRadius: 16,
    },
    signInText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
      fontWeight: '500',
    },
  });
export default RegisterScreen;