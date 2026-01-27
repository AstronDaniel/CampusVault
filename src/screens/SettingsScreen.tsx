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

const { width, height } = Dimensions.get('window');

const SettingsScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;

  // App settings state
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(isDark);
  const [autoDownloadWifi, setAutoDownloadWifi] = useState(false);
  const [dataSaver, setDataSaver] = useState(false);
  const [cacheSize, setCacheSize] = useState('0 MB');
  const [appVersion] = useState('2.0.0');
  const [buildNumber] = useState('2024.01');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    getUserId();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('appSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setNotifications(parsed.notifications ?? true);
        setAutoDownloadWifi(parsed.autoDownloadWifi ?? false);
        setDataSaver(parsed.dataSaver ?? false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
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

  const saveSettings = async () => {
    try {
      const settings = {
        notifications,
        autoDownloadWifi,
        dataSaver,
      };
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
      
      // Note: In a real app, you would dispatch a theme change action
      // For now, we'll just show a toast
      if (darkMode !== isDark) {
        Toast.show({
          type: 'info',
          text1: 'Theme Change',
          text2: 'App restart required for theme changes',
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Settings Saved',
          text2: 'Your preferences have been updated',
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: 'Failed to save settings',
      });
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
              await authService.logout();
              await AsyncStorage.clear();
              // Don't navigate - the auth context will handle switching to auth stack
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
    // Replace with your privacy policy URL
    const url = 'https://example.com/privacy';
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
    // Replace with your terms of service URL
    const url = 'https://example.com/terms';
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
    const email = 'support@campusvault.com';
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
            icon="bell-outline"
            title="Notifications"
            subtitle="Receive updates about your resources"
            type="toggle"
            value={notifications}
            onPress={() => setNotifications(!notifications)}
            color="#6366F1"
          />
          
          <SettingItem
            icon="theme-light-dark"
            title="Dark Mode"
            subtitle="Use dark theme"
            type="toggle"
            value={darkMode}
            onPress={() => setDarkMode(!darkMode)}
            color="#8B5CF6"
          />
          
          <SettingItem
            icon="wifi"
            title="Auto-download on WiFi"
            subtitle="Automatically download resources on WiFi"
            type="toggle"
            value={autoDownloadWifi}
            onPress={() => setAutoDownloadWifi(!autoDownloadWifi)}
            color="#10B981"
          />
          
          <SettingItem
            icon="speedometer"
            title="Data Saver Mode"
            subtitle="Reduce data usage"
            type="toggle"
            value={dataSaver}
            onPress={() => setDataSaver(!dataSaver)}
            color="#F59E0B"
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

        {/* Account Section */}
        <Section title="ACCOUNT">
          <SettingItem
            icon="account-key"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => navigation.navigate('ChangePassword')}
            color="#10B981"
          />
          
          <SettingItem
            icon="account-multiple"
            title="Connected Accounts"
            subtitle="Manage linked accounts"
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Connected Accounts',
              text2: 'Feature coming soon',
            })}
            color="#8B5CF6"
          />
          
          <SettingItem
            icon="export"
            title="Export Data"
            subtitle="Download your data"
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Export Data',
              text2: 'Feature coming soon',
            })}
            color="#F59E0B"
          />
        </Section>

        {/* Support Section */}
        <Section title="SUPPORT">
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help or report issues"
            onPress={openSupport}
            color="#3B82F6"
          />
          
          <SettingItem
            icon="star-face"
            title="Rate CampusVault"
            subtitle="Share your feedback"
            onPress={() => {
              const storeUrl = Platform.OS === 'ios' 
                ? 'https://apps.apple.com/app/id...'
                : 'https://play.google.com/store/apps/details?id=...';
              Linking.openURL(storeUrl).catch(err => {
                console.error('Failed to open store:', err);
              });
            }}
            color="#FBBF24"
          />
          
          <SettingItem
            icon="share-variant"
            title="Share App"
            subtitle="Tell friends about CampusVault"
            onPress={() => Toast.show({
              type: 'info',
              text1: 'Share App',
              text2: 'Feature coming soon',
            })}
            color="#8B5CF6"
          />
        </Section>

        {/* Legal Section */}
        <Section title="LEGAL">
          <SettingItem
            icon="shield-check"
            title="Privacy Policy"
            onPress={openPrivacyPolicy}
            color="#10B981"
          />
          
          <SettingItem
            icon="file-document"
            title="Terms of Service"
            onPress={openTermsOfService}
            color="#6366F1"
          />
          
          <SettingItem
            icon="copyright"
            title="Licenses"
            onPress={() => navigation.navigate('Licenses')}
            color="#6B7280"
          />
        </Section>

        {/* About Section */}
        <Section title="ABOUT">
          <View style={styles.aboutItem}>
            <View style={styles.aboutInfo}>
              <Text style={[styles.aboutLabel, { color: theme.colors.outline }]}>
                Version
              </Text>
              <Text style={[styles.aboutValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {appVersion} ({buildNumber})
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

        {/* Danger Zone */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Text style={[styles.dangerTitle, { color: theme.colors.error }]}>
            DANGER ZONE
          </Text>
          <Surface style={[styles.dangerCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.dangerButton}
              textColor="#EF4444"
              icon="logout"
            >
              Sign Out of Account
            </Button>
            
            <Divider style={[styles.divider, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]} />
            
            <Button
              mode="outlined"
              onPress={handleDeleteAccount}
              style={styles.dangerButton}
              textColor="#EF4444"
              icon="delete"
            >
              Delete Account
            </Button>
          </Surface>
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <Button
            mode="contained"
            onPress={saveSettings}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            labelStyle={styles.saveButtonLabel}
            icon="content-save"
          >
            Save Settings
          </Button>
        </Animated.View>

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