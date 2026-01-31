import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, RefreshControl, ImageBackground } from 'react-native';
import { useTheme, Surface, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

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

    const actions = [
        { title: 'User Management', subtitle: 'Manage users, roles & permissions', icon: 'account-cog', color: '#3B82F6', route: 'UserManagement' },
        { title: 'Chat Support', subtitle: 'View and respond to student messages', icon: 'chat-processing', color: '#EC4899', route: 'AdminChatList' },
        { title: 'Analytics', subtitle: 'Detailed insights and reports', icon: 'chart-line', color: '#8B5CF6', route: 'Analytics' },
        { title: 'Broadcast Message', subtitle: 'Send notifications to all users', icon: 'bullhorn-variant', color: '#F59E0B', route: 'Broadcast' },
    ];

    // Prepare chart data
    const chartData = {
        labels: dailyDownloads.slice(-7).map(d => {
            const date = new Date(d.day);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        }),
        datasets: [{
            data: dailyDownloads.slice(-7).map(d => d.count || 0),
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            strokeWidth: 3
        }]
    };

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

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}>
            <StatusBar barStyle="light-content" />

            {/* Header with Image Background and Fade */}
            <ImageBackground
                source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80' }}
                style={styles.headerBg}
                imageStyle={styles.headerImage}
            >
                <LinearGradient
                    colors={['rgba(99, 102, 241, 0.95)', 'rgba(139, 92, 246, 0.85)', 'transparent']}
                    style={styles.headerGradient}
                >
                    <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContent}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Icon name="arrow-left" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <View style={styles.titleRow}>
                                <Icon name="shield-crown" size={28} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.headerTitle}>Admin Dashboard</Text>
                            </View>
                            <Text style={styles.headerSubtitle}>Platform Control Center</Text>
                        </View>
                        <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
                            <Icon name="refresh" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>
                </LinearGradient>
            </ImageBackground>

            <ScrollView
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
                {/* Download Trends Chart */}
                <Animated.View entering={FadeInDown.delay(200)}>
                    <View style={styles.sectionHeader}>
                        <Icon name="chart-line" size={20} color="#6366F1" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
                            Download Trends (Last 7 Days)
                        </Text>
                    </View>
                    <Surface style={[styles.chartCard, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]} elevation={2}>
                        {dailyDownloads.length > 0 ? (
                            <>
                                <LineChart
                                    data={chartData}
                                    width={width - 64}
                                    height={220}
                                    chartConfig={{
                                        backgroundColor: isDark ? '#1F2937' : '#FFF',
                                        backgroundGradientFrom: isDark ? '#1F2937' : '#FFF',
                                        backgroundGradientTo: isDark ? '#1F2937' : '#FFF',
                                        decimalPlaces: 0,
                                        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                                        labelColor: (opacity = 1) => isDark ? `rgba(229, 231, 235, ${opacity})` : `rgba(31, 41, 55, ${opacity})`,
                                        style: {
                                            borderRadius: 16
                                        },
                                        propsForDots: {
                                            r: "6",
                                            strokeWidth: "2",
                                            stroke: "#6366F1"
                                        }
                                    }}
                                    bezier
                                    style={styles.chart}
                                />
                                <View style={styles.chartStats}>
                                    <View style={styles.chartStat}>
                                        <Text style={[styles.chartStatLabel, { color: theme.colors.outline }]}>Total Downloads</Text>
                                        <Text style={[styles.chartStatValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                            {stats.totalDownloads.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.chartStat}>
                                        <Text style={[styles.chartStatLabel, { color: theme.colors.outline }]}>Avg/Day</Text>
                                        <Text style={[styles.chartStatValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                            {Math.round(dailyDownloads.reduce((sum, d) => sum + (d.count || 0), 0) / dailyDownloads.length).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.noDataContainer}>
                                <Icon name="chart-line-variant" size={48} color={theme.colors.outline} />
                                <Text style={[styles.noDataText, { color: theme.colors.outline }]}>No data available</Text>
                            </View>
                        )}
                    </Surface>
                </Animated.View>

                {/* Key Metrics */}
                <Animated.View entering={FadeInDown.delay(300)}>
                    <View style={styles.sectionHeader}>
                        <Icon name="speedometer" size={20} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
                            Key Metrics
                        </Text>
                    </View>
                    <Surface style={[styles.metricsCard, { backgroundColor: isDark ? '#1F2937' : '#FFF' }]} elevation={2}>
                        <View style={styles.metricRow}>
                            <View style={styles.metricIcon}>
                                <Icon name="account-group" size={24} color="#6366F1" />
                            </View>
                            <View style={styles.metricContent}>
                                <Text style={[styles.metricLabel, { color: theme.colors.outline }]}>Total Users</Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                    {stats.totalUsers.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        <Divider style={{ marginVertical: 12 }} />
                        <View style={styles.metricRow}>
                            <View style={styles.metricIcon}>
                                <Icon name="file-document-multiple" size={24} color="#10B981" />
                            </View>
                            <View style={styles.metricContent}>
                                <Text style={[styles.metricLabel, { color: theme.colors.outline }]}>Total Resources</Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                    {stats.totalResources.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        <Divider style={{ marginVertical: 12 }} />
                        <View style={styles.metricRow}>
                            <View style={styles.metricIcon}>
                                <Icon name="account-check-outline" size={24} color="#F59E0B" />
                            </View>
                            <View style={styles.metricContent}>
                                <Text style={[styles.metricLabel, { color: theme.colors.outline }]}>Active Today</Text>
                                <Text style={[styles.metricValue, { color: isDark ? '#FFF' : '#1F2937' }]}>
                                    {stats.activeToday.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </Surface>
                </Animated.View>

                {/* Quick Actions List */}
                <Animated.View entering={FadeInDown.delay(400)}>
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
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerBg: {
        width: '100%',
        paddingTop: 60,
        paddingBottom: 30,
    },
    headerImage: {
        opacity: 0.3,
    },
    headerGradient: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
        marginTop: 2,
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingTop: 24,
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
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    chartStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    chartStat: {
        alignItems: 'center',
    },
    chartStatLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    chartStatValue: {
        fontSize: 20,
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
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
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
});

export default AdminDashboardScreen;
