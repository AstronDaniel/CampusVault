import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme, Surface, Button, List, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, SlideInRight } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';
import packageJson from '../../package.json';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SettingsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;
  const { logout } = useAuth();

  // App settings state
  const [cacheSize, setCacheSize] = useState('0 MB');
  const [appVersion] = useState(packageJson.version);
  const [buildNumber] = useState(new Date().getFullYear().toString());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCacheSize();
    getUserId();
  }, []);

  const loadCacheSize = async () => {
    try {
      const size = await AsyncStorage.getItem('cacheSize');
      if (size) setCacheSize(size);
    } catch (error) {
      console.error('Failed to load cache size:', error);
    }
  };

  const getUserId = async () => {
    try {
      const userData = await AsyncStorage.getItem('userProfile');
      if (userData) {
        const user = JSON.parse(userData);
        setUserId(user.id || null);
      }
    } catch (error) {
      console.error('Failed to get user ID:', error);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This will not affect your uploaded resources.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all cache except user data
              const keys = await AsyncStorage.getAllKeys();
              const cacheKeys = keys.filter(key => 
                key.startsWith('cache_') || 
                key.includes('temp_') ||
                key === 'appSettings'
              );
              
              await AsyncStorage.multiRemove(cacheKeys);
              setCacheSize('0 MB');
              
              Toast.show({
                type: 'success',
                text1: 'Cache Cleared',
                text2: 'All cached data has been removed',
              });
            } catch (error) {
              console.error('Failed to clear cache:', error);
              Toast.show({
                type: 'error',
                text1: 'Clear Failed',
                text2: 'Failed to clear cache',
              });
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will automatically switch to auth stack due to isAuthenticated change
            } catch (error) {
              console.error('Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Logout Failed',
                text2: 'Please try again',
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data including uploaded resources will be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Note: This would navigate to a confirmation screen
            Toast.show({
              type: 'info',
              text1: 'Account Deletion',
              text2: 'This feature is under development',
            });
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    const url = 'https://campusvault.app/privacy';
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      Toast.show({
        type: 'error',
        text1: 'Cannot Open Link',
        text2: 'Please check your connection',
      });
    });
  };

  const openTermsOfService = () => {
    const url = 'https://campusvault.app/terms';
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      Toast.show({
        type: 'error',
        text1: 'Cannot Open Link',
        text2: 'Please check your connection',
      });
    });
  };

  const openLicenses = () => {
    const url = 'https://campusvault.app/licenses';
    Linking.openURL(url).catch(err => {
      console.error('Failed to open URL:', err);
      Toast.show({
        type: 'error',
        text1: 'Cannot Open Link',
        text2: 'Please check your connection',
      });
    });
  };

  const openSupport = () => {
    const email = 'noreply.campusvault@gmail.com';
    const subject = 'CampusVault Support';
    const body = `User ID: ${userId || 'Not logged in'}\nApp Version: ${appVersion}\n\nDescribe your issue:`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      .catch(err => {
        console.error('Failed to open email:', err);
        Toast.show({
          type: 'error',
          text1: 'Cannot Open Email',
          text2: 'Please setup an email client',
        });
      });
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    type = 'button',
    value,
    onPress,
    color = '#6366F1'
  }: any) => (
    <Animated.View entering={SlideInRight.delay(100)}>
      <TouchableOpacity
        style={[styles.settingItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
        onPress={onPress}
        disabled={type === 'toggle'}
        activeOpacity={0.7}
      >
        <View style={[styles.settingIcon, { backgroundColor: color + '15' }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: theme.colors.outline }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {type === 'toggle' ? (
          <Switch
            value={value}
            onValueChange={onPress}
            trackColor={{ false: isDark ? '#374151' : '#E5E7EB', true: color }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={isDark ? '#374151' : '#E5E7EB'}
          />
        ) : (
          <Icon name="chevron-right" size={20} color={theme.colors.outline} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const Section = ({ title, children }: any) => (
    <Animated.View entering={FadeInUp.delay(50)}>
      <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>
        {title}
      </Text>
      <Surface style={[styles.sectionCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        {children}
      </Surface>
    </Animated.View>
  );

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
          Settings
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.outline }]}>
          App preferences and account options
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}>
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Preferences Section */}
        <Section title="PREFERENCES">
          <SettingItem
            icon="theme-light-dark"
            title="Theme"
            subtitle="Follows system theme (Light/Dark)"
            color="#8B5CF6"
          />
        </Section>

        {/* Storage Section */}
        <Section title="STORAGE">
          <SettingItem
            icon="database"
            title="Clear Cache"
            subtitle={`Currently using ${cacheSize}`}
            onPress={handleClearCache}
            color="#EF4444"
          />
          
          <SettingItem
            icon="download"
            title="Download Location"
            subtitle="Choose where to save files"
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Download Location',
              text2: 'Feature coming soon',
            })}
            color="#3B82F6"
          />
        </Section>

        {/* Legal Section */}
        <Section title="LEGAL">
          <SettingItem
            icon="shield-check"
            title="Privacy Policy"
            subtitle="How we handle your data"
            onPress={openPrivacyPolicy}
            color="#10B981"
          />
          
          <SettingItem
            icon="file-document"
            title="Terms of Service"
            subtitle="Our terms and conditions"
            onPress={openTermsOfService}
            color="#6366F1"
          />
          
          <SettingItem
            icon="code-braces"
            title="Open Source Licenses"
            subtitle="Third-party libraries"
            onPress={openLicenses}
            color="#6B7280"
          />
        </Section>

        {/* About Section */}
        <Section title="ABOUT">
          <View style={styles.aboutDescriptionCard}>
            <View style={styles.aboutHeader}>
              <Icon name="school" size={32} color={theme.colors.primary} />
              <Text style={[styles.aboutAppName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                CampusVault
              </Text>
            </View>
            <Text style={[styles.aboutDescription, { color: theme.colors.outline }]}>
              Your ultimate platform for sharing and accessing educational resources. 
              Upload notes, past papers, and study materials to help fellow students succeed.
            </Text>
          </View>
          
          <View style={styles.aboutItem}>
            <View style={styles.aboutInfo}>
              <Text style={[styles.aboutLabel, { color: theme.colors.outline }]}>
                Version
              </Text>
              <Text style={[styles.aboutValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                v{appVersion}
              </Text>
            </View>
          </View>
          
          <View style={styles.aboutItem}>
            <View style={styles.aboutInfo}>
              <Text style={[styles.aboutLabel, { color: theme.colors.outline }]}>
                Build Year
              </Text>
              <Text style={[styles.aboutValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {buildNumber}
              </Text>
            </View>
          </View>
          
          <View style={styles.aboutItem}>
            <View style={styles.aboutInfo}>
              <Text style={[styles.aboutLabel, { color: theme.colors.outline }]}>
                User ID
              </Text>
              <Text style={[styles.aboutValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {userId || 'Not available'}
              </Text>
            </View>
          </View>
          
          <View style={styles.aboutItem}>
            <View style={styles.aboutInfo}>
              <Text style={[styles.aboutLabel, { color: theme.colors.outline }]}>
                Platform
              </Text>
              <Text style={[styles.aboutValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {Platform.OS === 'ios' ? 'iOS' : 'Android'}
              </Text>
            </View>
          </View>
        </Section>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Toast />
    </View>
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
    fontSize: 28,
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  aboutDescriptionCard: {
    padding: 20,
    marginBottom: 16,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  aboutAppName: {
    fontSize: 24,
    fontWeight: '700',
  },
  aboutDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  aboutItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  aboutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  dangerTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 12,
    marginLeft: 4,
  },
  dangerCard: {
    borderRadius: 20,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  dangerButton: {
    marginBottom: 12,
    borderColor: '#EF4444',
  },
  divider: {
    marginVertical: 12,
    height: 1,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 16,
    elevation: 4,
  },
  saveButtonContent: {
    height: 56,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default SettingsScreen;