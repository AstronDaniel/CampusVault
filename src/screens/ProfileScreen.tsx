import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl
} from 'react-native';
import { useTheme, Surface, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInUp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
  ZoomIn,
  FadeIn
} from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const BANNER_HEIGHT = 200;

const ProfileScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;
  const { logout } = useAuth();

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(true);

  const scrollY = useSharedValue(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setBannerLoading(true);

      const [profileRes, statsRes] = await Promise.all([
        authService.getProfile(),
        authService.getUserStats()
      ]);

      console.log('[ProfileScreen] Profile response:', profileRes);
      console.log('[ProfileScreen] Stats response:', statsRes);

      // Process user data
      const processedUser = {
        ...profileRes,
        first_name: profileRes.first_name || profileRes.name?.split(' ')[0] || 'User',
        last_name: profileRes.last_name || profileRes.name?.split(' ').slice(1).join(' ') || '',
        username: profileRes.username || profileRes.email?.split('@')[0] || 'user',
        email: profileRes.email || 'No email',
        avatar_url: profileRes.avatar_url || profileRes.profile_picture,
        banner_url: profileRes.banner_url, // Get banner URL from API
        is_verified: profileRes.is_verified || false,
        faculty: profileRes.faculty || profileRes.faculty_name,
        program: profileRes.program || profileRes.program_name,
        year: profileRes.year,
        semester: profileRes.semester,
        created_at: profileRes.created_at || new Date().toISOString(),
        bio: profileRes.bio || profileRes.description || '',
      };

      setUser(processedUser);

      // Process stats data
      const processedStats = {
        totalUploads: statsRes.total_uploads || statsRes.uploads || statsRes.totalUploads || 0,
        totalDownloads: statsRes.total_downloads || statsRes.downloads || statsRes.totalDownloads || 0,
        contributionScore: statsRes.contribution_score || statsRes.score || statsRes.contributionScore || 0,
        totalBookmarks: statsRes.total_bookmarks || statsRes.bookmarks || statsRes.totalBookmarks || 0,
        averageRating: statsRes.average_rating || statsRes.avg_rating || 0,
        resourcesCount: statsRes.resources_count || 0,
      };

      setStats(processedStats);

      // Cache user data for quick access
      await AsyncStorage.setItem('userProfile', JSON.stringify(processedUser));

    } catch (error: any) {
      console.error('[ProfileScreen] Failed to load profile data:', error);

      // Try to load cached data
      try {
        const cachedUser = await AsyncStorage.getItem('userProfile');
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);
          setUser(parsedUser);
          // If cached user doesn't have year/semester, estimate them
          if (!parsedUser.year || !parsedUser.semester) {
            setUser({
              ...parsedUser,
              year: getYearFromCreatedAt(parsedUser.created_at),
              semester: getDefaultSemester(),
            });
          }
        }
      } catch (cacheError) {
        console.error('[ProfileScreen] Failed to load cached data:', cacheError);
      }

      Toast.show({
        type: 'error',
        text1: 'Failed to load profile',
        text2: error.response?.data?.detail || error.message || 'Please check your connection',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
      setBannerLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to estimate year based on join date
  const getYearFromCreatedAt = (createdAt: string) => {
    if (!createdAt) return '1';

    try {
      const joinDate = new Date(createdAt.endsWith('Z') ? createdAt : createdAt + 'Z');
      const now = new Date();
      const diffYears = now.getFullYear() - joinDate.getFullYear();

      // If joined in current academic year, show 1st year
      // Adjust this logic based on your academic calendar
      return Math.max(1, Math.min(4, diffYears + 1)).toString();
    } catch (error) {
      return '1';
    }
  };

  // Helper function to get default semester
  const getDefaultSemester = () => {
    const month = new Date().getMonth();
    // Assume semesters: Jan-May = Sem 2, June-Dec = Sem 1
    return month >= 0 && month <= 5 ? '2' : '1';
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const bannerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [-100, 0],
      [BANNER_HEIGHT + 100, BANNER_HEIGHT],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    return { height, opacity };
  });

  const fabStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, 100],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              // Navigation will automatically switch to auth stack due to isAuthenticated change
            } catch (error) {
              console.error('[ProfileScreen] Logout error:', error);
              Toast.show({
                type: 'error',
                text1: 'Logout failed',
                text2: 'Please try again',
              });
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const handleChangePassword = () => {
    navigation.navigate('ChangePassword');
  };

  const handleMyResources = () => {
    navigation.navigate('MyResources');
  };

  const handleUploadBanner = () => {
    Toast.show({
      type: 'info',
      text1: 'Banner Upload',
      text2: 'Feature coming soon!',
    });
  };
  const handlePrivacySecurity = () => {
    navigation.navigate('Settings');
  };

  const handleAboutApp = () => {
    navigation.navigate('About');
  };

  const handleSupport = async () => {
    try {
      // Find the first admin user
      const users = await authService.searchUsers('admin');
      const admin = users.find((u: any) => u.role === 'admin' || u.role === 'ADMIN');
      if (admin) {
        navigation.navigate('Chat', {
          otherUser: {
            id: admin.id,
            full_name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || admin.username || 'Admin'
          }
        });
      } else {
        // Fallback to ID 1 if no admin found via search (temporary)
        navigation.navigate('Chat', {
          otherUser: { id: 1, full_name: 'Admin' }
        });
      }
    } catch (error) {
      // Fallback
      navigation.navigate('Chat', {
        otherUser: { id: 1, full_name: 'Admin' }
      });
    }
  };

  const MenuItem = ({ icon, title, subtitle, color, onPress, isLast }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, {
        borderBottomColor: isLast ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6')
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: color + '15' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
        {subtitle && <Text style={[styles.menuSubtitle, { color: theme.colors.outline }]}>{subtitle}</Text>}
      </View>
      <Icon name="chevron-right" size={20} color={theme.colors.outline} />
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color }: any) => (
    <Animated.View entering={ZoomIn.delay(300)}>
      <Surface style={[styles.statCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
        <View style={[styles.statIconBox, { backgroundColor: color + '10' }]}>
          <Icon name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{value || 0}</Text>
        <Text style={[styles.statLabel, { color: theme.colors.outline }]}>{label}</Text>
      </Surface>
    </Animated.View>
  );

  const formatJoinDate = (dateString: string) => {
    if (!dateString) return 'Recently joined';

    try {
      const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
      return `Joined ${date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      })}`;
    } catch (error) {
      return 'Recently joined';
    }
  };

  const getBannerColors = () => {
    // Fallback gradient colors if no banner
    if (isDark) {
      return ['#1a1a1a', '#2d2d2d'];
    } else {
      return [theme.colors.primary, '#6366F1'];
    }
  };

  if (loading && !user) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.outline }]}>
          Loading your profile...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
      {/* HERO BANNER */}
      <Animated.View style={[styles.banner, bannerStyle]}>
        {user?.banner_url ? (
          <Image
            source={{ uri: user.banner_url }}
            style={styles.bannerImage}
            resizeMode="cover"
            onLoadStart={() => setBannerLoading(true)}
            onLoadEnd={() => setBannerLoading(false)}
            onError={() => {
              console.log('[ProfileScreen] Failed to load banner image');
              setBannerLoading(false);
            }}
          />
        ) : (
          <LinearGradient
            colors={getBannerColors()}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {bannerLoading && (
          <View style={styles.bannerLoader}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        )}

        <View style={[styles.bannerOverlay, {
          backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'
        }]} />

        {/* Banner Upload Button */}
        <TouchableOpacity
          style={[styles.bannerUploadButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={handleUploadBanner}
          activeOpacity={0.8}
        >
          <Icon name="image-edit" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={isDark ? '#1E1E1E' : '#FFFFFF'}
          />
        }
      >
        {/* PROFILE HEADER */}
        <Animated.View entering={FadeInUp.delay(100)} style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatarImage}
                onError={() => console.log('Failed to load avatar')}
              />
            ) : (
              <View style={[
                styles.avatarFallback,
                { backgroundColor: theme.colors.primaryContainer }
              ]}>
                <Icon name="account" size={50} color={theme.colors.onPrimaryContainer} />
              </View>
            )}
            {user?.is_verified && (
              <View style={styles.badgeContainer}>
                <Icon name="check-decagram" size={22} color="#10B981" />
              </View>
            )}
          </View>

          <Text style={[styles.userName, { color: isDark ? '#fff' : '#000' }]}>
            {user?.first_name} {user?.last_name}
          </Text>

          <Text style={[styles.userHandle, { color: theme.colors.outline }]}>
            @{user?.username || 'user'}
          </Text>

          {user?.email && (
            <Text style={[styles.userEmail, { color: theme.colors.outline }]}>
              {user.email}
            </Text>
          )}

          <Text style={[styles.joinDate, { color: theme.colors.outline }]}>
            {formatJoinDate(user?.created_at)}
          </Text>
        </Animated.View>

        {/* STATS GRID */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>
            YOUR ACTIVITY
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="cloud-upload-outline"
              value={stats?.totalUploads}
              label="Uploads"
              color="#6366F1"
            />
            <StatCard
              icon="download-outline"
              value={stats?.totalDownloads}
              label="Downloads"
              color="#10B981"
            />
            <StatCard
              icon="star"
              value={stats?.contributionScore}
              label="Score"
              color="#F59E0B"
            />
            <StatCard
              icon="bookmark-outline"
              value={stats?.totalBookmarks}
              label="Saved"
              color="#8B5CF6"
            />
          </View>
        </Animated.View>

        {/* USER INFO CARD */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>
            ACADEMIC INFORMATION
          </Text>
          <Surface style={[styles.infoCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            {user?.faculty && (
              <View style={styles.infoRow}>
                <Icon name="school" size={16} color="#6366F1" />
                <Text style={[styles.infoLabel, { color: theme.colors.outline }]}>Faculty:</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                  {user.faculty}
                </Text>
              </View>
            )}

            {user?.program && (
              <View style={styles.infoRow}>
                <Icon name="book-education" size={16} color="#10B981" />
                <Text style={[styles.infoLabel, { color: theme.colors.outline }]}>Program:</Text>
                <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                  {user.program}
                </Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Icon name="calendar" size={16} color="#F59E0B" />
              <Text style={[styles.infoLabel, { color: theme.colors.outline }]}>Year/Semester:</Text>
              <Text style={[styles.infoValue, { color: isDark ? '#fff' : '#000' }]}>
                Year {user?.year || 'N/A'}, Sem {user?.semester || 'N/A'}
              </Text>
            </View>
          </Surface>
        </Animated.View>

        {/* MENU SECTIONS */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.menuContainer}>
          {user?.role === 'admin' && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.colors.primary, fontWeight: '900' }]}>ADMIN HUB</Text>
              <Surface style={[styles.menuCard, { backgroundColor: isDark ? '#1E1E1E' : '#EEF2FF', borderColor: theme.colors.primary, borderWidth: 1 }]}>
                <MenuItem
                  icon="shield-check-outline"
                  title="Admin Dashboard"
                  subtitle="Manage platform activities"
                  color={theme.colors.primary}
                  onPress={() => navigation.navigate('AdminDashboard')}
                />
                <MenuItem
                  icon="forum-outline"
                  title="Professional Chat"
                  subtitle="Manage multiple user conversations"
                  color="#8B5CF6"
                  onPress={() => navigation.navigate('AdminChatList')}
                  isLast
                />
              </Surface>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>ACCOUNT</Text>
          <Surface style={[styles.menuCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <MenuItem
              icon="account-edit-outline"
              title="Edit Profile"
              subtitle="Update personal info"
              color="#3B82F6"
              onPress={handleEditProfile}
            />
            <MenuItem
              icon="lock-outline"
              title="Change Password"
              subtitle="Keep your account secure"
              color="#10B981"
              onPress={handleChangePassword}
            />
            <MenuItem
              icon="folder-account-outline"
              title="My Resources"
              subtitle="View all your uploads"
              color="#F59E0B"
              onPress={handleMyResources}
              isLast
            />
          </Surface>

          <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>SUPPORT</Text>
          <Surface style={[styles.menuCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <MenuItem
              icon="message-text-outline"
              title="Admin Support"
              subtitle="Get help with your account"
              color="#F87171"
              onPress={handleSupport}
              isLast
            />
          </Surface>

          <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>APP SETTINGS</Text>
          <Surface style={[styles.menuCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <MenuItem
              icon="cog-outline"
              title="Settings & Privacy"
              color="#6366F1"
              onPress={handlePrivacySecurity}
              isLast
            />
          </Surface>

          <TouchableOpacity
            style={[styles.logoutBtn, {
              borderColor: '#EF4444',
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF'
            }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Icon name="logout-variant" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Sign Out of Account</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Quick Action FAB - Positioned higher */}
      <Animated.View style={[styles.fabContainer, fabStyle]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={handleEditProfile}
          activeOpacity={0.9}
        >
          <Icon name="pencil" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  banner: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerLoader: {
    position: 'absolute',
    zIndex: 2,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  bannerUploadButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  scrollContent: {
    paddingTop: BANNER_HEIGHT - 60,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#fff',
    padding: 4,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  avatarFallback: {
    width: 102,
    height: 102,
    borderRadius: 51,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    elevation: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  userHandle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 24,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    width: (width - 56) / 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 8,
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 8,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
    marginLeft: 16,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 40,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 10,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 80, // Moved higher up from the bottom
    right: 20,
    zIndex: 30,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});

export default ProfileScreen;