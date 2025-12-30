import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal
} from 'react-native';
import { useTheme, Surface, Button, Chip, Avatar, Portal, Dialog, Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  FadeInUp,
  FadeIn,
  SlideInRight,
  Layout
} from 'react-native-reanimated';
import * as ImagePicker from 'react-native-image-picker';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const EditProfileScreen = ({ navigation, route }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;
  const userData = route.params?.user || {};

  // Form state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(userData.avatar_url || null);
  const [banner, setBanner] = useState<string | null>(userData.banner_url || null);
  const [form, setForm] = useState({
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    username: userData.username || '',
    email: userData.email || '',
    bio: userData.bio || '',
    faculty: userData.faculty || '',
    program: userData.program || '',
    year: userData.year?.toString() || '',
    semester: userData.semester?.toString() || '',
  });

  // Modal states
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [deleteAvatarDialog, setDeleteAvatarDialog] = useState(false);
  const [deleteBannerDialog, setDeleteBannerDialog] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const scrollViewRef = useRef<ScrollView>(null);

  // Year options
  const yearOptions = ['1', '2', '3', '4', '5'];
  const semesterOptions = ['1', '2'];

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  const handleImagePick = async (type: 'avatar' | 'banner', source: 'camera' | 'gallery') => {
    try {
      const options: any = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: false,
      };

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCamera(options);
      } else {
        result = await ImagePicker.launchImageLibrary(options);
      }

      if (result.didCancel) return;
      if (result.errorCode) {
        console.error('Image picker error:', result.errorMessage);
        showSnackbar('Failed to pick image');
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.uri;

        if (type === 'avatar') {
          setAvatar(imageUri);
          setAvatarModalVisible(false);
          showSnackbar('Avatar updated (save to apply)');
        } else {
          setBanner(imageUri);
          setBannerModalVisible(false);
          showSnackbar('Banner updated (save to apply)');
        }
      }
    } catch (error) {
      console.error('Image pick error:', error);
      showSnackbar('Failed to pick image');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    setDeleteAvatarDialog(false);
    showSnackbar('Avatar removed (save to apply)');
  };

  const handleRemoveBanner = () => {
    setBanner(null);
    setDeleteBannerDialog(false);
    showSnackbar('Banner removed (save to apply)');
  };

  const handleUpdateProfile = async () => {
    // Validation
    if (!form.first_name.trim() || !form.last_name.trim()) {
      showSnackbar('First and last name are required');
      return;
    }

    if (!form.username.trim()) {
      showSnackbar('Username is required');
      return;
    }

    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      showSnackbar('Valid email is required');
      return;
    }

    try {
      setSaving(true);
      
      // Prepare update payload
      const payload: any = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
      };

      if (form.bio.trim()) {
        payload.bio = form.bio;
      }

      // TODO: Add faculty/program/year/semester when backend supports it

      console.log('[EditProfile] Update payload:', payload);

      // Update profile
      const updatedUser = await authService.updateProfile(payload);
      
      // Upload avatar if changed
      if (avatar && avatar.startsWith('file://')) {
        try {
          await authService.uploadAvatar({ uri: avatar, type: 'image/jpeg', name: 'avatar.jpg' });
        } catch (avatarError) {
          console.error('[EditProfile] Avatar upload failed:', avatarError);
          // Continue even if avatar upload fails
        }
      }

      // Upload banner if changed
      if (banner && banner.startsWith('file://')) {
        try {
          // Note: You'll need to add uploadBanner method to authService
          // await authService.uploadBanner({ uri: banner, type: 'image/jpeg', name: 'banner.jpg' });
        } catch (bannerError) {
          console.error('[EditProfile] Banner upload failed:', bannerError);
          // Continue even if banner upload fails
        }
      }

      // Update local cache
      await AsyncStorage.setItem('userProfile', JSON.stringify({
        ...userData,
        ...updatedUser,
        avatar_url: avatar && avatar.startsWith('http') ? avatar : updatedUser.avatar_url,
        banner_url: banner && banner.startsWith('http') ? banner : updatedUser.banner_url,
      }));

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
        text2: 'Your changes have been saved',
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('[EditProfile] Update failed:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update profile';
      showSnackbar(errorMessage);
    } finally {
      setSaving(false);
    }
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
      <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
        Edit Profile
      </Text>
      <View style={styles.headerRight}>
        {saving ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <TouchableOpacity onPress={handleUpdateProfile} style={styles.saveBtn}>
            <Text style={[styles.saveText, { color: theme.colors.primary }]}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  const renderAvatarSection = () => (
    <Animated.View entering={SlideInRight.delay(200)}>
      <Text style={[styles.sectionLabel, { color: theme.colors.outline }]}>PROFILE PHOTO</Text>
      <Surface style={[styles.avatarCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarPreview}>
            <TouchableOpacity
              onPress={() => setAvatarModalVisible(true)}
              style={styles.avatarTouchable}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Icon name="account" size={40} color={theme.colors.onPrimaryContainer} />
                </View>
              )}
              <View style={styles.avatarEditOverlay}>
                <Icon name="camera" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.avatarActions}>
            <TouchableOpacity
              style={[styles.avatarActionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => setAvatarModalVisible(true)}
            >
              <Icon name="image-edit" size={16} color="#FFFFFF" />
              <Text style={styles.avatarActionText}>Change</Text>
            </TouchableOpacity>
            
            {avatar && (
              <TouchableOpacity
                style={[styles.avatarActionBtn, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}
                onPress={() => setDeleteAvatarDialog(true)}
              >
                <Icon name="delete" size={16} color={theme.colors.error} />
                <Text style={[styles.avatarActionText, { color: theme.colors.error }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <Text style={[styles.avatarHint, { color: theme.colors.outline }]}>
          Tap photo to change. Recommended: Square, 500x500px
        </Text>
      </Surface>
    </Animated.View>
  );

  const renderBannerSection = () => (
    <Animated.View entering={SlideInRight.delay(250)}>
      <Text style={[styles.sectionLabel, { color: theme.colors.outline }]}>PROFILE BANNER</Text>
      <Surface style={[styles.bannerCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={styles.bannerSection}>
          <TouchableOpacity
            onPress={() => setBannerModalVisible(true)}
            style={styles.bannerTouchable}
            activeOpacity={0.8}
          >
            {banner ? (
              <Image source={{ uri: banner }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <View style={[styles.bannerPlaceholder, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                <Icon name="image" size={40} color={theme.colors.outline} />
                <Text style={[styles.bannerPlaceholderText, { color: theme.colors.outline }]}>
                  Add a banner image
                </Text>
              </View>
            )}
            <View style={styles.bannerEditOverlay}>
              <Icon name="camera" size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          
          <View style={styles.bannerActions}>
            <TouchableOpacity
              style={[styles.bannerActionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => setBannerModalVisible(true)}
            >
              <Icon name="image-edit" size={16} color="#FFFFFF" />
              <Text style={styles.bannerActionText}>Change Banner</Text>
            </TouchableOpacity>
            
            {banner && (
              <TouchableOpacity
                style={[styles.bannerActionBtn, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}
                onPress={() => setDeleteBannerDialog(true)}
              >
                <Icon name="delete" size={16} color={theme.colors.error} />
                <Text style={[styles.bannerActionText, { color: theme.colors.error }]}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <Text style={[styles.bannerHint, { color: theme.colors.outline }]}>
          Recommended: 1200x400px, JPG or PNG
        </Text>
      </Surface>
    </Animated.View>
  );

  const renderFormSection = () => (
    <Animated.View entering={SlideInRight.delay(300)}>
      <Text style={[styles.sectionLabel, { color: theme.colors.outline }]}>PERSONAL INFORMATION</Text>
      <Surface style={[styles.formCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>First Name</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB',
              color: isDark ? '#FFFFFF' : '#111827',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }]}
            value={form.first_name}
            onChangeText={(text) => setForm({ ...form, first_name: text })}
            placeholder="Enter your first name"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          />
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>Last Name</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB',
              color: isDark ? '#FFFFFF' : '#111827',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }]}
            value={form.last_name}
            onChangeText={(text) => setForm({ ...form, last_name: text })}
            placeholder="Enter your last name"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          />
        </View>

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>Username</Text>
          <View style={styles.usernameContainer}>
            <Text style={[styles.usernamePrefix, { color: theme.colors.outline }]}>@</Text>
            <TextInput
              style={[styles.input, styles.usernameInput, {
                backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB',
                color: isDark ? '#FFFFFF' : '#111827',
                borderColor: isDark ? '#374151' : '#E5E7EB'
              }]}
              value={form.username}
              onChangeText={(text) => setForm({ ...form, username: text.replace(/\s/g, '') })}
              placeholder="username"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>Email Address</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB',
              color: isDark ? '#FFFFFF' : '#111827',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }]}
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            placeholder="email@example.com"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: isDark ? '#2A2A2A' : '#F9FAFB',
              color: isDark ? '#FFFFFF' : '#111827',
              borderColor: isDark ? '#374151' : '#E5E7EB'
            }]}
            value={form.bio}
            onChangeText={(text) => setForm({ ...form, bio: text })}
            placeholder="Tell others about yourself..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            multiline
            numberOfLines={4}
            maxLength={160}
          />
          <Text style={[styles.charCount, { color: theme.colors.outline }]}>
            {form.bio.length}/160
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );

  const renderAcademicSection = () => (
    <Animated.View entering={SlideInRight.delay(350)}>
      <Text style={[styles.sectionLabel, { color: theme.colors.outline }]}>ACADEMIC INFORMATION</Text>
      <Surface style={[styles.academicCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        {/* Year Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {yearOptions.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.chip,
                  form.year === year && { backgroundColor: theme.colors.primary },
                  { borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}
                onPress={() => setForm({ ...form, year })}
              >
                <Text style={[
                  styles.chipText,
                  form.year === year && { color: '#FFFFFF' },
                  { color: isDark ? '#FFFFFF' : '#111827' }
                ]}>
                  Year {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Semester Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.outline }]}>Semester</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {semesterOptions.map((semester) => (
              <TouchableOpacity
                key={semester}
                style={[
                  styles.chip,
                  form.semester === semester && { backgroundColor: theme.colors.primary },
                  { borderColor: isDark ? '#374151' : '#E5E7EB' }
                ]}
                onPress={() => setForm({ ...form, semester })}
              >
                <Text style={[
                  styles.chipText,
                  form.semester === semester && { color: '#FFFFFF' },
                  { color: isDark ? '#FFFFFF' : '#111827' }
                ]}>
                  Semester {semester}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Faculty & Program (Read-only for now) */}
        <View style={styles.inputGroup}>
          <View style={styles.academicInfoRow}>
            <View style={styles.academicInfoItem}>
              <Icon name="school" size={16} color={theme.colors.outline} />
              <Text style={[styles.academicLabel, { color: theme.colors.outline }]}>Faculty</Text>
              <Text style={[styles.academicValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {form.faculty || 'Not specified'}
              </Text>
            </View>
            
            <View style={styles.academicDivider} />
            
            <View style={styles.academicInfoItem}>
              <Icon name="book-education" size={16} color={theme.colors.outline} />
              <Text style={[styles.academicLabel, { color: theme.colors.outline }]}>Program</Text>
              <Text style={[styles.academicValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {form.program || 'Not specified'}
              </Text>
            </View>
          </View>
          
          <Text style={[styles.academicHint, { color: theme.colors.outline }]}>
            Faculty and program cannot be changed here
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );

  const AvatarModal = () => (
    <Modal
      visible={avatarModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setAvatarModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Change Profile Photo
            </Text>
            <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}
            onPress={() => handleImagePick('avatar', 'camera')}
          >
            <Icon name="camera" size={24} color={theme.colors.primary} />
            <Text style={[styles.modalOptionText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Take Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}
            onPress={() => handleImagePick('avatar', 'gallery')}
          >
            <Icon name="image" size={24} color={theme.colors.primary} />
            <Text style={[styles.modalOptionText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>

          {avatar && (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setAvatarModalVisible(false);
                setDeleteAvatarDialog(true);
              }}
            >
              <Icon name="delete" size={24} color={theme.colors.error} />
              <Text style={[styles.modalOptionText, { color: theme.colors.error }]}>
                Remove Current Photo
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const BannerModal = () => (
    <Modal
      visible={bannerModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setBannerModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Change Banner
            </Text>
            <TouchableOpacity onPress={() => setBannerModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.outline} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}
            onPress={() => handleImagePick('banner', 'camera')}
          >
            <Icon name="camera" size={24} color={theme.colors.primary} />
            <Text style={[styles.modalOptionText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Take Photo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalOption, { borderBottomColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}
            onPress={() => handleImagePick('banner', 'gallery')}
          >
            <Icon name="image" size={24} color={theme.colors.primary} />
            <Text style={[styles.modalOptionText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              Choose from Gallery
            </Text>
          </TouchableOpacity>

          {banner && (
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setBannerModalVisible(false);
                setDeleteBannerDialog(true);
              }}
            >
              <Icon name="delete" size={24} color={theme.colors.error} />
              <Text style={[styles.modalOptionText, { color: theme.colors.error }]}>
                Remove Current Banner
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {renderHeader()}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderAvatarSection()}
        {renderBannerSection()}
        {renderFormSection()}
        {renderAcademicSection()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modals */}
      <AvatarModal />
      <BannerModal />

      {/* Delete Dialogs */}
      <Portal>
        <Dialog
          visible={deleteAvatarDialog}
          onDismiss={() => setDeleteAvatarDialog(false)}
          style={{ backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }}
        >
          <Dialog.Title style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Remove Profile Photo?
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.outline }}>
              Are you sure you want to remove your profile photo?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteAvatarDialog(false)} textColor={theme.colors.outline}>
              Cancel
            </Button>
            <Button onPress={handleRemoveAvatar} textColor={theme.colors.error}>
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={deleteBannerDialog}
          onDismiss={() => setDeleteBannerDialog(false)}
          style={{ backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }}
        >
          <Dialog.Title style={{ color: isDark ? '#FFFFFF' : '#111827' }}>
            Remove Banner?
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.outline }}>
              Are you sure you want to remove your profile banner?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteBannerDialog(false)} textColor={theme.colors.outline}>
              Cancel
            </Button>
            <Button onPress={handleRemoveBanner} textColor={theme.colors.error}>
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: isDark ? '#1E1E1E' : '#111827' }}
      >
        <Text style={{ color: '#FFFFFF' }}>{snackbarMessage}</Text>
      </Snackbar>

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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  avatarCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPreview: {
    marginRight: 20,
  },
  avatarTouchable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActions: {
    flex: 1,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatarActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  bannerCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  bannerSection: {
    marginBottom: 12,
  },
  bannerTouchable: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
  },
  bannerPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  bannerEditOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
  },
  bannerActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    color: '#FFFFFF',
  },
  bannerHint: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '500',
    borderWidth: 1,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernamePrefix: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  usernameInput: {
    flex: 1,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 4,
  },
  academicCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  academicInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  academicInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  academicLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  academicValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  academicDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  academicHint: {
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 16,
  },
});

export default EditProfileScreen;