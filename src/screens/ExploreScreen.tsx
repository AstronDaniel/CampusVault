import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl, StatusBar } from 'react-native';
import { useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

const ExploreScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

    const [faculties, setFaculties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadFaculties();
    }, []);

    const loadFaculties = async () => {
        setLoading(true);
        try {
            const response = await authService.getFaculties();
            const data = Array.isArray(response) ? response : (response?.items || []);
            const normalized = data.map((f: any) => ({
                ...f,
                programs_count: Number(f?.programs_count) || 0,
            }));
            setFaculties(normalized);
        } catch (error) {
            console.error('Failed to load faculties:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getFacultyColor = (index: number) => {
        const colors = [
            ['#6366F1', '#4F46E5'], // Indigo
            ['#10B981', '#059669'], // Emerald
            ['#F59E0B', '#D97706'], // Amber
            ['#EC4899', '#DB2777'], // Pink
            ['#8B5CF6', '#7C3AED'], // Violet
        ];
        return colors[index % colors.length];
    };

    const getFacultyIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('computing') || lowerName.includes('science') || lowerName.includes('tech')) return 'laptop';
        if (lowerName.includes('business') || lowerName.includes('commerce') || lowerName.includes('management')) return 'briefcase-outline';
        if (lowerName.includes('engineering')) return 'cog-outline';
        if (lowerName.includes('law')) return 'gavel';
        if (lowerName.includes('medicine') || lowerName.includes('health')) return 'medical-bag';
        if (lowerName.includes('art') || lowerName.includes('humanities')) return 'palette-outline';
        if (lowerName.includes('education')) return 'school-outline';
        return 'school';
    };

    // TRUE BLACK COLORS
    const bgColor = isDark ? '#000000' : '#F9FAFB';
    const cardBg = isDark ? '#0A0A0A' : '#FFFFFF';
    const borderColor = isDark ? '#1F1F1F' : '#F3F4F6';
    const textColor = isDark ? '#FFFFFF' : '#111827';
    const subTextColor = isDark ? '#A1A1AA' : '#6B7280';

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* MINIMALIST HEADER */}
            <View style={[styles.header, { borderBottomColor: borderColor }]}>
                <Animated.View entering={FadeInUp.duration(600)} style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>Explore</Text>
                    <Text style={[styles.headerSubtitle, { color: subTextColor }]}>Academic Faculties</Text>
                </Animated.View>
                <TouchableOpacity style={[styles.notificationBtn, { backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6' }]}>
                    <Icon name="bell-outline" size={24} color={textColor} />
                    <View style={styles.notifDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadFaculties(); }}
                        tintColor={isDark ? '#fff' : theme.colors.primary}
                    />
                }
            >
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : faculties.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="folder-open-outline" size={64} color={borderColor} />
                        <Text style={[styles.emptyText, { color: textColor }]}>No faculties discovered yet</Text>
                    </View>
                ) : (
                    <View style={styles.facultyGrid}>
                        {faculties.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.delay(index * 100).duration(500)}
                            >
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('FacultyDetail', { faculty: item })}
                                    activeOpacity={0.9}
                                    style={[styles.facultyCard, { backgroundColor: cardBg, borderColor: borderColor }]}
                                >
                                    <View style={styles.cardHeader}>
                                        <LinearGradient
                                            colors={getFacultyColor(index)}
                                            style={styles.iconCircle}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Icon name={getFacultyIcon(item.name)} size={28} color="#FFFFFF" />
                                        </LinearGradient>
                                        <View style={styles.cardHeaderInfo}>
                                            <Text style={[styles.facultyName, { color: textColor }]}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.facultyCode, { color: subTextColor }]}>
                                                {item.code || 'FACULTY'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardFooter}>
                                        <View style={styles.statItem}>
                                            <Icon name="book-open-page-variant-outline" size={16} color={subTextColor} />
                                            <Text style={[styles.statText, { color: subTextColor }]}>
                                                {item.programs_count} Programs
                                            </Text>
                                        </View>
                                        <View style={[styles.arrowBox, { backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB' }]}>
                                            <Icon name="arrow-right" size={16} color={textColor} />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                )}
                <View style={{ height: 120 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
    },
    headerTitleContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: -2,
    },
    notificationBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notifDot: {
        position: 'absolute',
        top: 12,
        right: 14,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    facultyGrid: {
        gap: 16,
    },
    facultyCard: {
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardHeaderInfo: {
        marginLeft: 16,
        flex: 1,
    },
    facultyName: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    facultyCode: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.03)',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        fontWeight: '600',
    },
    arrowBox: {
        width: 32,
        height: 32,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        marginTop: 100,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 16,
        opacity: 0.6,
    },
});

export default ExploreScreen;
