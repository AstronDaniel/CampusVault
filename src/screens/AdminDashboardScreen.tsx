import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';
import { useTheme, Surface, Divider } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedScrollHandler, useSharedValue, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;
    const insets = useSafeAreaInsets();
    const scrollY = useSharedValue(0);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalResources: 0,
        totalDownloads: 0,
        activeToday: 0,
    });
    const [dailyDownloads, setDailyDownloads] = useState<any[]>([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);

            const [statsData, downloadsData] = await Promise.all([
                authService.getAdminStats(),
                authService.getDailyDownloads(7)
            ]);

            setStats({
                totalUsers: statsData.total_users || 0,
                totalResources: statsData.total_resources || 0,
                totalDownloads: statsData.total_downloads || 0,
                activeToday: statsData.active_users_today || 0,
            });

            setDailyDownloads(downloadsData || []);
        } catch (error: any) {
            console.error('[AdminDashboard] Failed to load stats:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to Load Dashboard',
                text2: error.message || 'Could not fetch admin statistics'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadDashboardData(true);
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, 100],
            [1, 0.8],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    const actions = [
        { title: 'User Management', subtitle: 'Manage users, roles & permissions', icon: 'account-cog', color: '#3B82F6', route: 'UserManagement' },
        { title: 'Chat Support', subtitle: 'View and respond to student messages', icon: 'chat-processing', color: '#EC4899', route: 'AdminChatList' },
        { title: 'Analytics', subtitle: 'Detailed insights and reports', icon: 'chart-line', color: '#8B5CF6', route: 'Analytics' },
        { title: 'Broadcast Message', subtitle: 'Send notifications to all users', icon: 'bullhorn-variant', color: '#F59E0B', route: 'Broadcast' },
    ];

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <StatusBar barStyle="light-content" />
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#6366F1" />
                    <Text style={[styles.loadingText, { color: theme.colors.outline }]}>Loading dashboard...</Text>
                </View>
            </View>
        );
    }

    const downloadCounts = dailyDownloads.slice(-7).map(d => d.count || 0);
    const chartData = dailyDownloads.slice(-7).map((d, index) => ({
        date: d.date || `Day ${index + 1}`,
        count: d.count || 0
    }));

    const handlePeriodChange = async (period: string) => {
        try {
            // This function is kept for potential future use
            console.log('Period changed to:', period);
        } catch (error) {
            console.error('Failed to load chart data:', error);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}>
            <StatusBar barStyle="light-content" />

            {/* Navigation Bar */}
            <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                    Admin Dashboard
                </Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
                    <Icon name="refresh" size={22} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
            </View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#6366F1"
                        colors={['#6366F1']}
                    />
                }
            >
                {/* Header Card with Background Image */}
                <Animated.View 
                    entering={FadeInDown.duration(500)} 
                    style={styles.headerCard}
                >
                    <ImageBackground
                        source={{ uri: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80' }}
                        style={styles.headerCardBg}
                        imageStyle={styles.headerCardImage}
                    >
                        <LinearGradient
                            colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.2)', 'transparent']}
                            style={styles.headerCardGradient}
                        >
                            <View style={styles.headerCardContent}>
                                <View style={styles.titleSection}>
                                    <Icon name="shield-crown" size={32} color="#FFF" />
                                    <View style={styles.titleText}>
                                        <Text style={styles.headerTitle}>Admin Dashboard</Text>
                                        <Text style={styles.headerSubtitle}>Platform Control Center • Real-time Analytics</Text>
                                    </View>
                                </View>
                                <View style={styles.quickStats}>
                                    <View style={styles.statItem}>
                                        <Icon name="account-group" size={20} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.statValue}>{stats.totalUsers}</Text>
                                        <Text style={styles.statLabel}>Users</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Icon name="file-document-multiple" size={20} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.statValue}>{stats.totalResources}</Text>
                                        <Text style={styles.statLabel}>Resources</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Icon name="download" size={20} color="rgba(255,255,255,0.9)" />
                                        <Text style={styles.statValue}>{stats.totalDownloads}</Text>
                                        <Text style={styles.statLabel}>Downloads</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </ImageBackground>
                </Animated.View>
                {/* Enhanced Key Metrics */}
                <Animated.View entering={FadeInDown.delay(700)}>
                    <View style={styles.sectionHeader}>
                        <Icon name="speedometer" size={20} color="#3B82F6" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
                            Platform Overview
                        </Text>
                    </View>
                    
                    {/* Metrics Grid */}
                    <View style={styles.metricsGrid}>
                        <Animated.View entering={FadeInDown.delay(300)} style={[styles.metricCard, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                            <LinearGradient
                                colors={['#3B82F6', '#1E40AF']}
                                style={styles.metricIconContainer}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                            >
                                <Icon name="account-group" size={28} color="#FFF" />
                            </LinearGradient>
                            <View style={styles.metricInfo}>
                                <Text style={[styles.metricLabel, { color: theme.colors.outline }]}>Total Users</Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                    {stats.totalUsers.toLocaleString()}
                                </Text>
                                <View style={styles.metricBadge}>
                                    <Icon name="trending-up" size={12} color="#10B981" />
                                    <Text style={[styles.metricTrend, { color: '#10B981' }]}>+12%</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(400)} style={[styles.metricCard, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                            <LinearGradient
                                colors={['#10B981', '#059669']}
                                style={styles.metricIconContainer}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                            >
                                <Icon name="file-document-multiple" size={28} color="#FFF" />
                            </LinearGradient>
                            <View style={styles.metricInfo}>
                                <Text style={[styles.metricLabel, { color: theme.colors.outline }]}>Resources</Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                    {stats.totalResources.toLocaleString()}
                                </Text>
                                <View style={styles.metricBadge}>
                                    <Icon name="trending-up" size={12} color="#10B981" />
                                    <Text style={[styles.metricTrend, { color: '#10B981' }]}>+8%</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(500)} style={[styles.metricCard, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                            <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                style={styles.metricIconContainer}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                            >
                                <Icon name="download" size={28} color="#FFF" />
                            </LinearGradient>
                            <View style={styles.metricInfo}>
                                <Text style={[styles.metricLabel, { color: theme.colors.outline }]}>Downloads</Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                    {stats.totalDownloads.toLocaleString()}
                                </Text>
                                <View style={styles.metricBadge}>
                                    <Icon name="trending-up" size={12} color="#10B981" />
                                    <Text style={[styles.metricTrend, { color: '#10B981' }]}>+24%</Text>
                                </View>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(600)} style={[styles.metricCard, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]}>
                            <LinearGradient
                                colors={['#8B5CF6', '#7C3AED']}
                                style={styles.metricIconContainer}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 1}}
                            >
                                <Icon name="account-check" size={28} color="#FFF" />
                            </LinearGradient>
                            <View style={styles.metricInfo}>
                                <Text style={[styles.metricLabel, { color: theme.colors.outline }]}>Active Today</Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                    {stats.activeToday.toLocaleString()}
                                </Text>
                                <View style={styles.metricBadge}>
                                    <Icon name="trending-up" size={12} color="#10B981" />
                                    <Text style={[styles.metricTrend, { color: '#10B981' }]}>+5%</Text>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                </Animated.View>

                {/* Quick Actions List */}
                <Animated.View entering={FadeInDown.delay(700)}>
                    <View style={styles.sectionHeader}>
                        <Icon name="lightning-bolt" size={20} color="#F59E0B" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
                            Quick Actions
                        </Text>
                    </View>
                    <Surface style={[styles.actionsCard, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]} elevation={2}>
                        {actions.map((action, index) => (
                            <React.Fragment key={index}>
                                <TouchableOpacity
                                    style={styles.actionItem}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        if (action.route === 'UserManagement' || action.route === 'AdminChatList') {
                                            navigation.navigate(action.route);
                                        } else {
                                            Toast.show({
                                                type: 'info',
                                                text1: 'Coming Soon',
                                                text2: `${action.title} feature is under development`
                                            });
                                        }
                                    }}
                                >
                                    <View style={[styles.actionIconContainer, { backgroundColor: action.color + '15' }]}>
                                        <Icon name={action.icon} size={24} color={action.color} />
                                    </View>
                                    <View style={styles.actionTextContainer}>
                                        <Text style={[styles.actionTitle, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                            {action.title}
                                        </Text>
                                        <Text style={[styles.actionSubtitle, { color: theme.colors.outline }]}>
                                            {action.subtitle}
                                        </Text>
                                    </View>
                                    <Icon name="chevron-right" size={24} color={theme.colors.outline} />
                                </TouchableOpacity>
                                {index < actions.length - 1 && <Divider />}
                            </React.Fragment>
                        ))}
                    </Surface>
                </Animated.View>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 12,
    },
    backBtn: {
        padding: 4,
    },
    navTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
    },
    refreshBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerCard: {
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 20,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerCardBg: {
        width: '100%',
    },
    headerCardImage: {
        opacity: 0.3,
        resizeMode: 'cover',
    },
    headerCardGradient: {
        padding: 20,
    },
    headerCardContent: {
        gap: 20,
    },
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    titleText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        marginTop: 4,
    },
    quickStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    chartCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
    },
    enhancedChart: {
        marginVertical: 8,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
        padding: 2,
    },
    periodBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginHorizontal: 1,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '700',
    },
    chartArea: {
        height: 160,
        position: 'relative',
        marginBottom: 20,
    },
    gridLines: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: '100%',
    },
    gridLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.05)',
    },
    lineContainer: {
        position: 'relative',
        height: '100%',
    },
    dataPoint: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    connectingLine: {
        position: 'absolute',
        height: 2,
        transformOrigin: '0 50%',
    },
    yAxisLabels: {
        position: 'absolute',
        left: -40,
        height: '100%',
    },
    yLabel: {
        position: 'absolute',
        fontSize: 10,
        color: '#6B7280',
        fontWeight: '600',
    },
    chartSummary: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    noDataText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },
    metricsCard: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    metricContent: {
        flex: 1,
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.7,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 2,
    },
    actionsCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    actionSubtitle: {
        fontSize: 12,
        fontWeight: '500',
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: '600',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    metricCard: {
        width: (width - 56) / 2,
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    metricIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    metricInfo: {
        gap: 4,
    },
    metricBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    metricTrend: {
        fontSize: 11,
        fontWeight: '700',
    },
});

export default AdminDashboardScreen;
