import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

const CourseDetailsScreen = ({ route, navigation }: any) => {
    const { course } = route.params;
    const theme = useTheme();
    const isDark = theme.dark;

    const [selectedTab, setSelectedTab] = useState<'notes' | 'past'>('notes');
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resourceCount, setResourceCount] = useState<number | null>(null);

    const scrollY = useSharedValue(0);

    useEffect(() => {
        loadResources();
    }, [selectedTab]);

    useEffect(() => {
        // Fetch both notes and past papers count for header using new endpoint
        const fetchResourceCount = async () => {
            try {
                const notesCount = await authService.getResourceCount(course.id, 'notes');
                const pastCount = await authService.getResourceCount(course.id, 'past_paper');
                setResourceCount((notesCount || 0) + (pastCount || 0));
                console.log('[CourseDetailsScreen] Resource counts:', { notesCount, pastCount });
            } catch (err) {
                console.error('[CourseDetailsScreen] Failed to fetch resource counts:', err);
                setResourceCount(null);
            }
        };
        fetchResourceCount();
    }, [course.id]);

    const loadResources = async () => {
        setLoading(true);
        try {
            // Use correct resource_type that matches backend
            const resourceType = selectedTab === 'notes' ? 'notes' : 'past_paper';
            const response = await authService.getResources(course.id, resourceType);
            console.log('[CourseDetailsScreen] Raw API response:', response);
            let data = response?.items || (Array.isArray(response) ? response : []);
            // Map legacy field size_bytes to file_size and resource_type for compatibility
            data = data.map((item: any) => {
                // Format file size
                let rawSize = item.file_size || item.size_bytes || 0;
                let formattedSize = '';
                if (typeof rawSize === 'number') {
                    if (rawSize >= 1024 * 1024) {
                        formattedSize = (rawSize / (1024 * 1024)).toFixed(2) + ' MB';
                    } else if (rawSize >= 1024) {
                        formattedSize = (rawSize / 1024).toFixed(2) + ' KB';
                    } else {
                        formattedSize = rawSize + ' B';
                    }
                } else {
                    formattedSize = rawSize || 'N/A';
                }
                return {
                    ...item,
                    file_size: formattedSize,
                    resource_type: item.resource_type || item.type || '',
                };
            });
            // Log all resources for debugging
            console.log('[CourseDetailsScreen] All resources:', data);
            // No need for client-side filtering - backend already filters by resource_type
            console.log('[CourseDetailsScreen] Fetched resources:', data);
            setResources(data);
        } catch (error) {
            console.error('Failed to load resources:', error);
            setResources([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const headerStyle = useAnimatedStyle(() => {
        const height = interpolate(
            scrollY.value,
            [0, HEADER_HEIGHT - 80],
            [HEADER_HEIGHT, 100],
            Extrapolate.CLAMP
        );
        return { height };
    });

    const headerTitleStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [HEADER_HEIGHT - 120, HEADER_HEIGHT - 80],
            [0, 1],
            Extrapolate.CLAMP
        );
        const translateX = interpolate(
            scrollY.value,
            [HEADER_HEIGHT - 120, HEADER_HEIGHT - 80],
            [-20, 0],
            Extrapolate.CLAMP
        );
        return { opacity, transform: [{ translateX }] };
    });

    const getCourseImage = (id: any) => {
        return `https://picsum.photos/seed/${id}/800/600`;
    };

    const getResourceCount = (item: any) => {
        return item.resources_count ?? item.resourcesCount ?? item.total_resources ??
            item.count ?? item.num_resources ?? item.total ??
            item.files_count ?? item.resources?.length ?? 0;
    };

    const getFileIcon = (fileType: string) => {
        const type = fileType?.toLowerCase() || '';
        if (type.includes('pdf')) return { name: 'file-pdf-box', color: '#EF4444' };
        if (type.includes('doc')) return { name: 'file-word-box', color: '#2563EB' };
        if (type.includes('xls') || type.includes('csv')) return { name: 'file-excel-box', color: '#10B981' };
        if (type.includes('ppt')) return { name: 'file-powerpoint-box', color: '#F97316' };
        if (type.includes('image') || type.includes('jpg') || type.includes('png')) return { name: 'file-image', color: '#8B5CF6' };
        if (type.includes('txt')) return { name: 'file-document-edit', color: '#6B7280' };
        return { name: 'file-document', color: theme.colors.primary };
    };

    // Get file type tag label and color based on content_type
    const getFileTypeTag = (contentType: string) => {
        const type = contentType?.toLowerCase() || '';
        if (type.includes('pdf')) return { label: 'PDF', color: '#EF4444' };
        if (type.includes('word') || type.includes('doc')) return { label: 'DOC', color: '#2563EB' };
        if (type.includes('excel') || type.includes('sheet') || type.includes('xls') || type.includes('csv')) return { label: 'XLS', color: '#10B981' };
        if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return { label: 'PPT', color: '#F97316' };
        if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return { label: 'IMG', color: '#8B5CF6' };
        if (type.includes('text') || type.includes('txt')) return { label: 'TXT', color: '#6B7280' };
        if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return { label: 'ZIP', color: '#64748B' };
        return { label: 'FILE', color: '#9CA3AF' };
    };

    // Format rating to 1 decimal place like legacy code
    const formatRating = (rating: number | undefined | null): string => {
        if (rating === undefined || rating === null) return '0.0';
        return Number(rating).toFixed(1);
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : theme.colors.background }]}>
            {/* STICKY PARALLAX HEADER */}
            <Animated.View style={[styles.header, headerStyle, { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface }]}>
                <Image
                    source={{ uri: getCourseImage(course.id) }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'transparent', isDark ? '#121212' : '#fff']}
                    locations={[0, 0.4, 1]}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.navBar, { paddingTop: 50 }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.roundBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
                    >
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Animated.Text style={[styles.navTitle, headerTitleStyle, { color: isDark ? '#fff' : '#000' }]}>
                        {course.code}
                    </Animated.Text>

                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.headerContent}>
                    <Animated.View entering={FadeInUp.delay(200).duration(800)}>
                        <Text style={styles.courseCodeLabel}>{course.code}</Text>
                        <Text style={[styles.courseName, { color: isDark ? '#fff' : '#000' }]}>{course.name}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.headerStat}>
                                <Icon name="file-document-outline" size={16} color={isDark ? 'rgba(255,255,255,0.7)' : theme.colors.outline} />
                                <Text style={[styles.statText, { color: isDark ? 'rgba(255,255,255,0.7)' : theme.colors.outline }]}>
                                    {resourceCount !== null ? resourceCount : '...'} Resources
                                </Text>
                            </View>
                            <View style={styles.dot} />
                            <View style={styles.headerStat}>
                                <Icon name="calendar" size={16} color={theme.colors.primary} />
                                <Text style={[styles.statText, { color: isDark ? 'rgba(255,255,255,0.7)' : theme.colors.outline }]}>
                                    Year {course.year}
                                </Text>
                            </View>
                            <View style={styles.dot} />
                            <View style={styles.headerStat}>
                                <Icon name="calendar-month" size={16} color={theme.colors.secondary} />
                                <Text style={[styles.statText, { color: isDark ? 'rgba(255,255,255,0.7)' : theme.colors.outline }]}>
                                    Semester {course.semester || '-'}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            </Animated.View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
            >
                {/* TABS (Segmented Control) */}
                <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1E1E1E' : '#e5e7eb' }]}>
                    <TouchableOpacity
                        onPress={() => setSelectedTab('notes')}
                        style={[styles.tab, selectedTab === 'notes' && [styles.activeTab, { backgroundColor: theme.colors.primary }]]}
                    >
                        <Icon name="book-open-page-variant" size={18} color={selectedTab === 'notes' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : '#444')} />
                        <Text style={[styles.tabText, { color: selectedTab === 'notes' ? '#fff' : (isDark ? '#aaa' : '#222') }, selectedTab === 'notes' && styles.activeTabText]}>Course Notes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setSelectedTab('past')}
                        style={[styles.tab, selectedTab === 'past' && [styles.activeTab, { backgroundColor: theme.colors.primary }]]}
                    >
                        <Icon name="history" size={18} color={selectedTab === 'past' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : '#444')} />
                        <Text style={[styles.tabText, { color: selectedTab === 'past' ? '#fff' : (isDark ? '#aaa' : '#222') }, selectedTab === 'past' && styles.activeTabText]}>Past Papers</Text>
                    </TouchableOpacity>
                </View>

                {/* CONTENT */}
                <View style={styles.listContainer}>
                    {loading ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={[styles.loaderText, { color: theme.colors.outline }]}>Fetching brilliant resources...</Text>
                        </View>
                    ) : resources.length === 0 ? (
                        <Animated.View entering={FadeInDown} style={styles.emptyContainer}>
                            <Icon name="folder-open-outline" size={64} color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                            <Text style={[styles.emptyTitle, { color: isDark ? '#fff' : '#000' }]}>No resources yet</Text>
                            <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>Be the first to upload for this unit!</Text>
                            <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.colors.primary }]}>
                                <Text style={styles.uploadBtnText}>Upload Now</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    ) : (
                        resources.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.delay(index * 100)}
                            >
                                <TouchableOpacity
                                    style={[styles.resourceCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}
                                    onPress={() => navigation.navigate('ResourceDetails', { resource: item })}
                                >
                                    <View style={[styles.iconContainer, { backgroundColor: getFileIcon(item.file_type || item.content_type).color + '15' }]}>
                                        <Icon name={getFileIcon(item.file_type || item.content_type).name} size={32} color={getFileIcon(item.file_type || item.content_type).color} />
                                    </View>
                                    <View style={styles.resourceInfo}>
                                        <View style={styles.titleRow}>
                                            <Text style={[styles.resourceTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                                                {item.title}
                                            </Text>
                                            <View style={[styles.fileTypeBadge, { backgroundColor: getFileTypeTag(item.content_type).color + '20' }]}>
                                                <Text style={[styles.fileTypeText, { color: getFileTypeTag(item.content_type).color }]}>
                                                    {getFileTypeTag(item.content_type).label}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.metaRow}>
                                            <Text style={[styles.metaText, { color: isDark ? '#aaa' : '#444' }]}>
                                                {item.file_size || 'N/A'}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <Icon name="cloud-download-outline" size={16} color={theme.colors.primary} style={{ marginRight: 2 }} />
                                                <Text style={[styles.metaText, { color: isDark ? '#aaa' : '#444', marginRight: 8 }]}>{item.download_count || 0}</Text>
                                                <View style={styles.ratingBadge}>
                                                    <Icon name="star" size={12} color="#FBBF24" />
                                                    <Text style={styles.ratingText}>{formatRating(item.average_rating)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                    <Icon name="chevron-right" size={24} color={theme.colors.outline} />
                                </TouchableOpacity>
                            </Animated.View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </Animated.ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        overflow: 'hidden',
    },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 20,
    },
    roundBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    headerContent: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
    },
    courseCodeLabel: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    courseName: {
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 34,
        marginBottom: 12,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statText: {
        fontSize: 13,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    scrollContent: {
        paddingTop: HEADER_HEIGHT + 20,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 6,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    activeTab: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.5)',
    },
    activeTabText: {
        color: '#fff',
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    loaderContainer: {
        alignItems: 'center',
        paddingTop: 50,
    },
    loaderText: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    },
    resourceCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
    },
    iconContainer: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resourceInfo: {
        flex: 1,
        marginLeft: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    fileTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 8,
    },
    fileTypeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    resourceTitle: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 10,
    },
    metaText: {
        fontSize: 12,
        fontWeight: '500',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        gap: 4,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#FBBF24',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 20,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 40,
    },
    uploadBtn: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    uploadBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '900',
    },
});

export default CourseDetailsScreen;
