import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useTheme, Surface, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInUp, SharedValue, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');
const BANNER_HEIGHT = 200;

const ProfileScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const scrollY = useSharedValue(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [profileRes, statsRes] = await Promise.all([
                authService.getProfile(),
                authService.getUserStats()
            ]);
            setUser(profileRes);
            setStats(statsRes);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setLoading(false);
        }
    };

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
        return { height };
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
                        await authService.logout();
                        navigation.replace('Login');
                    }
                }
            ]
        );
    };

    const MenuItem = ({ icon, title, subtitle, color, onPress, isLast }: any) => (
        <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: isLast ? 'transparent' : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6') }]}
            onPress={onPress}
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
        <Surface style={[styles.statCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
            <View style={[styles.statIconBox, { backgroundColor: color + '10' }]}>
                <Icon name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{value || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.outline }]}>{label}</Text>
        </Surface>
    );

    if (loading && !user) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
            {/* HERO BANNER */}
            <Animated.View style={[styles.banner, bannerStyle]}>
                <LinearGradient
                    colors={isDark ? ['#2D3748', '#1A202C'] : [theme.colors.primary, '#6366F1']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={[styles.bannerOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)' }]} />
            </Animated.View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* PROFILE HEADER */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        {user?.avatar_url ? (
                            <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <Avatar.Icon size={100} icon="account" style={{ backgroundColor: theme.colors.primaryContainer }} />
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
                    <Text style={[styles.userEmail, { color: theme.colors.outline }]}>@{user?.username || 'user'}</Text>
                </View>

                {/* STATS GRID */}
                <View style={styles.statsGrid}>
                    <StatCard icon="file-upload-outline" value={stats?.totalUploads} label="Uploads" color="#6366F1" />
                    <StatCard icon="download-outline" value={stats?.totalDownloads} label="Downloads" color="#10B981" />
                    <StatCard icon="star-face" value={stats?.contributionScore} label="Score" color="#F59E0B" />
                    <StatCard icon="bookmark-outline" value={stats?.totalBookmarks} label="Saved" color="#8B5CF6" />
                </View>

                {/* MENU SECTIONS */}
                <View style={styles.menuContainer}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>ACCOUNT</Text>
                    <Surface style={[styles.menuCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                        <MenuItem icon="account-edit-outline" title="Edit Profile" subtitle="Update personal info" color="#3B82F6" />
                        <MenuItem icon="lock-outline" title="Change Password" subtitle="Keep your account secure" color="#10B981" />
                        <MenuItem icon="folder-account-outline" title="My Resources" subtitle="View all your uploads" color="#F59E0B" isLast />
                    </Surface>

                    <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>APP SETTINGS</Text>
                    <Surface style={[styles.menuCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                        <MenuItem icon="bell-outline" title="Notifications" color="#8B5CF6" />
                        <MenuItem icon="shield-check-outline" title="Privacy & Security" color="#6366F1" />
                        <MenuItem icon="information-outline" title="About CampusVault" subtitle="Version 1.0.3" color="#6B7280" isLast />
                    </Surface>

                    <TouchableOpacity
                        style={[styles.logoutBtn, { borderColor: '#EF4444' }]}
                        onPress={handleLogout}
                    >
                        <Icon name="logout-variant" size={22} color="#EF4444" />
                        <Text style={styles.logoutText}>Sign Out of Account</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    banner: {
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 0,
    },
    bannerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    scrollContent: {
        paddingTop: BANNER_HEIGHT - 60,
    },
    profileHeader: {
        alignItems: 'center',
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
    },
    avatarImage: {
        width: 102,
        height: 102,
        borderRadius: 51,
    },
    badgeContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 2,
    },
    userName: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        fontWeight: '700',
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
    menuContainer: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuCard: {
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 4,
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
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '900',
        marginLeft: 10,
    },
});

export default ProfileScreen;
