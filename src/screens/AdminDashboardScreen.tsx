import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

    const stats = [
        { label: 'Total Users', value: '1,240', icon: 'account-group', color: '#6366F1' },
        { label: 'Files Uploaded', value: '458', icon: 'file-upload', color: '#10B981' },
        { label: 'Total Downloads', value: '12.5k', icon: 'download', color: '#F59E0B' },
        { label: 'Reports', value: '3', icon: 'alert-decagram', color: '#EF4444' },
    ];

    const actions = [
        { title: 'User Management', icon: 'account-cog', color: '#3B82F6', route: 'UserManagement' },
        { title: 'Resource Review', icon: 'file-check', color: '#10B981', route: 'ResourceReview' },
        { title: 'Broadcast Message', icon: 'bullhorn-variant', color: '#8B5CF6', route: 'Broadcast' },
        { title: 'Chat Hub', icon: 'chat-processing', color: '#EC4899', route: 'AdminChatList' },
        { title: 'App Settings', icon: 'tune', color: '#64748B', route: 'Settings' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={isDark ? ['#1A1A1A', '#111111'] : ['#1E1B4B', '#312E81']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Admin Command Center</Text>
                        <Text style={styles.headerSubtitle}>Platform Oversight & Analytics</Text>
                    </View>
                </Animated.View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.statWrapper}
                        >
                            <Surface style={[styles.statCard, { backgroundColor: isDark ? theme.colors.surface : '#FFF' }]} elevation={2}>
                                <View style={[styles.statIconBox, { backgroundColor: stat.color + '15' }]}>
                                    <Icon name={stat.icon} size={22} color={stat.color} />
                                </View>
                                <Text style={[styles.statValue, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: theme.colors.outline }]}>{stat.label}</Text>
                            </Surface>
                        </Animated.View>
                    ))}
                </View>

                {/* Main Actions */}
                <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>QUICK MANAGEMENT</Text>
                <View style={styles.actionGrid}>
                    {actions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            activeOpacity={0.8}
                            onPress={() => console.log('Navigate to:', action.route)}
                        >
                            <Surface style={[styles.actionCard, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]} elevation={2}>
                                <LinearGradient
                                    colors={[action.color, action.color + 'CC']}
                                    style={styles.actionIconBox}
                                >
                                    <Icon name={action.icon} size={28} color="#FFF" />
                                </LinearGradient>
                                <Text style={[styles.actionTitle, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{action.title}</Text>
                            </Surface>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Recent Activity (Placeholder) */}
                <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>RECENT ACTIVITY</Text>
                <Surface style={[styles.activityCard, { backgroundColor: isDark ? theme.colors.surface : '#FFF' }]} elevation={1}>
                    {[1, 2, 3].map((_, i) => (
                        <View key={i} style={[styles.activityItem, i < 2 && { borderBottomWidth: 1, borderBottomColor: isDark ? theme.colors.surfaceVariant : '#F1F5F9' }]}>
                            <View style={styles.activityDot} />
                            <View style={styles.activityInfo}>
                                <Text style={[styles.activityText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
                                    New user registered: <Text style={{ fontWeight: 'bold' }}>John Doe</Text>
                                </Text>
                                <Text style={[styles.activityTime, { color: theme.colors.outline }]}>2 hours ago</Text>
                            </View>
                        </View>
                    ))}
                </Surface>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    scrollContent: {
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: -30,
        marginBottom: 24,
    },
    statWrapper: {
        width: (width - 56) / 2,
        marginBottom: 16,
    },
    statCard: {
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
    },
    statIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 1.2,
        marginBottom: 16,
        marginLeft: 4,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    actionCard: {
        width: (width - 56) / 2,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 16,
    },
    actionIconBox: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    actionTitle: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    activityCard: {
        borderRadius: 20,
        padding: 16,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6366F1',
        marginRight: 16,
    },
    activityInfo: {
        flex: 1,
    },
    activityText: {
        fontSize: 14,
    },
    activityTime: {
        fontSize: 11,
        marginTop: 2,
    },
});

export default AdminDashboardScreen;
