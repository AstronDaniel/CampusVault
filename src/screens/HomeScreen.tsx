import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
    ImageBackground,
    Platform,
    FlatList,
    Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from "@react-native-community/netinfo";
import Animated, {
    FadeInDown,
    FadeInRight,
    FadeInUp,
    FadeOut,
    ZoomIn,
    ZoomOut,
    LinearTransition,
    Layout,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

import { IMAGES } from '../config/images';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { bannerService, BannerData } from '../services/bannerService';
import BannerCard from '../components/common/BannerCard';

// Curated high-quality Unsplash images for education/tech
const COURSE_IMAGES = [
    'https://images.unsplash.com/photo-1498050108023-c5249f4df085', // Laptop/Code
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6', // Books
    'https://images.unsplash.com/photo-1523050335456-c38a89b7828a', // Graduation
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f', // Tech/Hardware
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8', // Study Table
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97', // Laptop Coding
    'https://images.unsplash.com/photo-1509228468518-180dd4864904', // Math/Notebook
    'https://images.unsplash.com/photo-1501504905252-473c47e087f8', // Library Books
    'https://images.unsplash.com/photo-1510074377623-8cf13fb86c08', // Desk/Lamp
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc51', // Servers/Tech
];

// Default banner for users without custom banner
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1600&auto=format&fit=crop'; // Modern tech/workspace

const getCourseImage = (id: string | number) => {
    const index = typeof id === 'number' ? id % COURSE_IMAGES.length : (id.length % COURSE_IMAGES.length);
    return `${COURSE_IMAGES[index]}?q=80&w=1000&auto=format&fit=crop`;
};

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }: { navigation: any }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isDark = theme.dark;
    const [selectedProgram, setSelectedProgram] = useState<any>(null);


    // Resource count state
    const [resourceCounts, setResourceCounts] = useState<{ [key: string]: number }>({});
    const getResourceCount = (item: any) => {
        const id = item.id || item.code;
        if (resourceCounts[id] !== undefined) return resourceCounts[id];
        return item.resources_count ?? item.resourcesCount ?? item.total_resources ??
            item.count ?? item.num_resources ?? item.total ??
            item.files_count ?? item.resources?.length ?? 0;
    };

    // UI State
    const [selectedYear, setSelectedYear] = useState(1);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileCard, setShowProfileCard] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Data State
    const [courseUnits, setCourseUnits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isFromCache, setIsFromCache] = useState(false);
    
    // Banner State
    const [activeBanners, setActiveBanners] = useState<BannerData[]>([]);
    const [dismissedBanners, setDismissedBanners] = useState<number[]>([]);
    const [bannerLoading, setBannerLoading] = useState(false);

 
    // Fetch resource counts for all course units
    useEffect(() => {
        const fetchCounts = async () => {
            if (!courseUnits || courseUnits.length === 0) return;
            const counts: { [key: string]: number } = {};
            await Promise.all(courseUnits.map(async (unit) => {
                try {
                    const resources = await authService.getResources(unit.id);
                    counts[unit.id || unit.code] = Array.isArray(resources) ? resources.length : (resources?.items?.length || 0);
                } catch {
                    counts[unit.id || unit.code] = 0;
                }
            }));
            setResourceCounts(counts);
        };
        fetchCounts();
    }, [courseUnits]);

    // Connectivity Monitoring
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsOnline(!!state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    // Real Data Loading
    const loadCourseUnits = useCallback(async () => {
        if (!user?.program_id) return;

        setIsLoading(true);
        try {
            let data;
            if (searchQuery.length > 1) {
                // Global Program Search - Find any course in the program
                data = await authService.searchProgramUnits(user.program_id, searchQuery);
            } else {
                // Year/Sem specific view
                data = await authService.getCourseUnits(
                    user.program_id,
                    selectedYear,
                    selectedSemester
                );
            }

            // Check if we got data or it's empty
            setCourseUnits(data || []);
            setIsFromCache(!isOnline);
        } catch (error) {
            console.error('Failed to load course units', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear, selectedSemester, searchQuery, user?.program_id, isOnline]);

    useEffect(() => {
        loadCourseUnits();
    }, [loadCourseUnits]);

    // Search Autocomplete Logic (Client-side filtering)
    useEffect(() => {
        if (searchQuery.length < 2) {
            setFilteredResults([]);
            setIsSearchModalVisible(false);
            return;
        }

        // Debounce for smoother UX
        const timeoutId = setTimeout(async () => {
            try {
                if (isOnline && user?.program_id) {
                    setIsLoading(true);
                    const response = await authService.searchProgramUnits(user.program_id, searchQuery);
                    // Force array type and filter out any non-objects
                    let results = Array.isArray(response) ? response : [];
                    // Filter client-side for phrase match in name or code
                    const phrase = searchQuery.trim().toLowerCase();
                    results = results.filter(item => {
                        const name = (item.name || '').toLowerCase();
                        const code = (item.code || '').toLowerCase();
                        return name.includes(phrase) || code.includes(phrase);
                    });
                    setFilteredResults(results);
                    setIsLoading(false);
                }
            } catch (e) {
                console.error('Autocomplete error', e);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, isOnline]);

    // Reload banners when screen is focused (no cache to ensure fresh data)
    useFocusEffect(
        useCallback(() => {
            console.log('🎯 HomeScreen: Screen focused - loading fresh banners...');
            loadBanners();
        }, [])
    );

    const loadBanners = useCallback(async () => {
        if (bannerLoading) {
            console.log('🚫 HomeScreen: Banner loading already in progress, skipping...');
            return;
        }
        
        console.log('🎯 HomeScreen: Starting to load banners (fresh from backend)...');
        setBannerLoading(true);
        try {
            // Fetch banners fresh from backend (no cache)
            const banners = await bannerService.getActiveBanners(); 
            
            // Filter to only show active banners
            const activeBannersList = banners.filter((banner: BannerData) => {
                const isActive = banner.is_active !== false; // Default to true if not specified
                const isNotExpired = !banner.expires_at || new Date(banner.expires_at) > new Date();
                return isActive && isNotExpired;
            });
            
            console.log('✅ HomeScreen: Successfully fetched banners:', activeBannersList);
            console.log('📊 HomeScreen: Number of active banners:', activeBannersList.length);
            console.log('📊 HomeScreen: Filtered out inactive/expired banners');
            if (activeBannersList.length > 0) {
                activeBannersList.forEach((banner, index) => {
                    console.log(`📌 Banner ${index + 1}:`, {
                        id: banner.id,
                        title: banner.title,
                        is_active: banner.is_active,
                        expires_at: banner.expires_at || 'no expiration'
                    });
                });
            }
            setActiveBanners(activeBannersList);
        } catch (error) {
            console.error('❌ HomeScreen: Error loading banners:', error);
            // Fail gracefully - don't show error to user
            setActiveBanners([]);
        } finally {
            setBannerLoading(false);
            console.log('🏁 HomeScreen: Banner loading completed');
        }
    }, [bannerLoading]);

    // Handle banner dismissal (local only, won't affect other users)
    const handleDismissBanner = useCallback((bannerId: number) => {
        setDismissedBanners(prev => [...prev, bannerId]);
    }, []);

    // Get visible banners (active and not dismissed)
    const visibleBanners = activeBanners.filter(banner => 
        !dismissedBanners.includes(banner.id)
    );
    
    // Log visible banners for debugging
    React.useEffect(() => {
        console.log('👀 HomeScreen: Active banners state:', activeBanners);
        console.log('🚫 HomeScreen: Dismissed banner IDs:', dismissedBanners);
        console.log('✨ HomeScreen: Visible banners after filtering:', visibleBanners);
        console.log('📱 HomeScreen: Will render', visibleBanners.length, 'banner(s)');
    }, [activeBanners, dismissedBanners, visibleBanners]);

    const getAbbreviation = (name: string) => {
        if (!name) return 'N/A';
        const words = name.split(/\s+/);
        const abbr = words
            .filter(w => !['of', 'the', 'and', 'in'].includes(w.toLowerCase()))
            .map(w => w[0]?.toUpperCase())
            .join('');
        return abbr || name.substring(0, 3).toUpperCase();
    };

    const programCode = user?.program?.code || (user?.program?.name ? getAbbreviation(user.program.name) : 'BSC');
    const facultyCode = user?.faculty?.code || (user?.faculty?.name ? getAbbreviation(user.faculty.name) : 'COCIS');

    const durationYears = user?.program?.duration_years || 4;
    const yearArray = Array.from({ length: durationYears }, (_, i) => i + 1);

    
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={isDark ? "light-content" : "dark-content"}
                backgroundColor={theme.colors.background}
                translucent
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile & Course Info Section */}
                <Animated.View
                    entering={FadeInUp.duration(600)}
                    style={[styles.profileCourseSection, {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.colors.surfaceVariant,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.outlineVariant,
                    }]}
                >
                    <TouchableOpacity
                        style={styles.profileInfoRow}
                        onPress={() => setShowProfileCard(true)}
                        activeOpacity={0.7}
                    >
                        {/* User Avatar */}
                        <View style={styles.avatarContainer}>
                            <View style={[styles.avatarGlow, { backgroundColor: theme.colors.primary }]} />
                            <View style={[styles.avatarWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}>
                                {user?.avatar_url ? (
                                    <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
                                ) : (
                                    <Icon name="account" size={32} color={theme.colors.primary} />
                                )}
                            </View>
                            {/* Connectivity Dot */}
                            <View style={[styles.connectivityDot, { backgroundColor: isOnline ? '#4ADE80' : '#F87171' }]} />
                        </View>

                        {/* User & Course Info */}
                        <View style={styles.infoColumn}>
                            <Text style={[styles.userName, { color: theme.colors.onSurface }]} numberOfLines={1}>
                                {user?.username || 'Student'}
                            </Text>
                            <View style={styles.courseRow}>
                                <View style={[styles.courseBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                                    <Text style={[styles.courseBadgeText, { color: theme.colors.primary }]}>
                                        {programCode}
                                    </Text>
                                </View>
                                <Text style={[styles.courseDetails, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                                    {user?.program?.name || 'Computer Science'}
                                </Text>
                            </View>
                            <View style={styles.academicInfo}>
                                <View style={styles.infoChip}>
                                    <Icon name="school" size={12} color={theme.colors.outline} />
                                    <Text style={[styles.infoChipText, { color: theme.colors.outline }]}>
                                        {facultyCode}
                                    </Text>
                                </View>
                                {user?.year && (
                                    <View style={styles.infoChip}>
                                        <Icon name="calendar" size={12} color={theme.colors.outline} />
                                        <Text style={[styles.infoChipText, { color: theme.colors.outline }]}>
                                            Y{user.year} S{user?.semester || 1}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Arrow Icon */}
                        <Icon name="chevron-right" size={24} color={theme.colors.outline} />
                    </TouchableOpacity>

                    {/* Offline Mode Badge */}
                    {isFromCache && (
                        <View style={styles.offlineTag}>
                            <Icon name="wifi-off" size={10} color="#fff" />
                            <Text style={styles.offlineTagText}>Offline Mode</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Floating Search Bar */}
                <Animated.View
                    entering={FadeInDown.delay(200).springify()}
                    style={[styles.floatingSearch, {
                        backgroundColor: isDark ? theme.colors.surface : '#fff',
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.outlineVariant,
                    }]}
                >
                    <Icon name="magnify" size={20} color={theme.colors.outline} />
                    <TextInput
                        placeholder="Search course units..."
                        placeholderTextColor={theme.colors.outline}
                        style={[styles.floatingSearchInput, { color: theme.colors.onSurface }]}
                        value={searchQuery}
                        onChangeText={(text) => {
                            setSearchQuery(text);
                            if (text.length >= 2) setIsSearchModalVisible(true);
                            else if (text.length === 0) setIsSearchModalVisible(false);
                        }}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => {
                            setSearchQuery('');
                            setIsSearchModalVisible(false);
                        }}>
                            <Icon name="close-circle" size={20} color={theme.colors.outline} />
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Banner Section - Dynamic banners from backend */}
                {visibleBanners.length > 0 && (
                    <Animated.View entering={FadeInDown.delay(150).springify()}>
                        {visibleBanners.map((banner, index) => (
                            <BannerCard
                                key={banner.id}
                                banner={banner}
                                onDismiss={() => handleDismissBanner(banner.id)}
                                style={{
                                    marginBottom: 8,
                                }}
                            />
                        ))}
                    </Animated.View>
                )}

                {/* 2. Selectors with Staggered Entrance */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={[styles.label, { color: theme.colors.onBackground }]}>Select Year</Text>
                    <View style={styles.chipGroup}>
                        {yearArray.map(y => (
                            <TouchableOpacity
                                key={y}
                                onPress={() => setSelectedYear(y)}
                                style={[
                                    styles.chip,
                                    selectedYear === y ? { backgroundColor: theme.colors.primary } : { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.surfaceVariant }
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: selectedYear === y ? '#fff' : (isDark ? 'rgba(255,255,255,0.8)' : theme.colors.onSurfaceVariant) }
                                ]}>Year {y}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Text style={[styles.label, { color: theme.colors.onBackground }]}>Select Semester</Text>
                    <View style={styles.chipGroup}>
                        {[1, 2].map(s => (
                            <TouchableOpacity
                                key={s}
                                onPress={() => setSelectedSemester(s)}
                                style={[
                                    styles.chip,
                                    selectedSemester === s ? { backgroundColor: theme.colors.secondary } : { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.surfaceVariant }
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: selectedSemester === s ? '#fff' : (isDark ? 'rgba(255,255,255,0.8)' : theme.colors.onSurfaceVariant) }
                                ]}>Semester {s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* 3. Course Units List/Grid Header */}
                <Animated.View
                    entering={FadeInDown.delay(400).duration(800)}
                    style={styles.sectionHeader}
                >
                    <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Course Units</Text>

                    {/* View Switcher */}
                    <View style={[styles.viewSwitcher, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.surfaceVariant }]}>
                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            style={[styles.switchBtn, viewMode === 'list' && { backgroundColor: theme.colors.primary }]}
                        >
                            <Icon name="format-list-bulleted" size={18} color={viewMode === 'list' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : theme.colors.outline)} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('grid')}
                            style={[styles.switchBtn, viewMode === 'grid' && { backgroundColor: theme.colors.primary }]}
                        >
                            <Icon name="view-grid" size={18} color={viewMode === 'grid' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : theme.colors.outline)} />
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {isLoading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator color={theme.colors.primary} />
                    </View>
                ) : (
                    <View style={viewMode === 'list' ? styles.list : styles.grid}>
                        {courseUnits.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                layout={LinearTransition.springify()}
                                entering={FadeInDown.delay(300 + index * 50).springify()}
                                style={viewMode === 'list' ? [
                                    styles.card,
                                    {
                                        backgroundColor: isDark ? theme.colors.surface : theme.colors.surface,
                                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.outlineVariant,
                                    }
                                ] : [
                                    styles.gridCard,
                                    {
                                        backgroundColor: isDark ? theme.colors.surface : theme.colors.surface,
                                        borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.colors.outlineVariant,
                                    }
                                ]}
                            >
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('CourseDetails', { course: item })}
                                    activeOpacity={0.9}
                                    style={viewMode === 'list' ? styles.cardTouchable : StyleSheet.absoluteFill}
                                >
                                    {viewMode === 'list' ? (
                                        <>
                                            <View style={styles.listImageContainer}>
                                                <Image
                                                    source={{ uri: getCourseImage(item.id || item.code) }}
                                                    style={styles.listImage}
                                                    resizeMode="cover"
                                                />
                                                <View style={styles.listBadgeOverlay}>
                                                    <Text style={styles.listBadgeText}>
                                                        Year {item.year || selectedYear} Semester {item.semester || selectedSemester}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.listContent}>
                                                <View>
                                                    <Text style={[styles.cardCode, { color: isDark ? theme.colors.primary : theme.colors.primary }]}>
                                                        {item.code}
                                                    </Text>
                                                    <Text
                                                        style={[styles.cardName, { color: isDark ? '#fff' : theme.colors.onSurface, fontSize: 14 }]}
                                                        numberOfLines={1}
                                                    >
                                                        {item.name}
                                                    </Text>
                                                </View>
                                                <View style={styles.cardFooter}>
                                                    <View style={styles.resourceCount}>
                                                        <Icon name="file-document-outline" size={12} color={isDark ? 'rgba(255,255,255,0.6)' : theme.colors.outline} />
                                                        <Text style={[styles.resourceCountText, { color: isDark ? 'rgba(255,255,255,0.6)' : theme.colors.outline, fontSize: 10 }]}>
                                                            {getResourceCount(item)} {getResourceCount(item) === 1 ? 'Resource' : 'Resources'}
                                                        </Text>
                                                    </View>
                                                    <Icon name="chevron-right" size={18} color={theme.colors.primary} />
                                                </View>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            {/* Grid Card Visual */}
                                            <View style={styles.gridImageContainer}>
                                                <Image
                                                    source={{ uri: getCourseImage(item.id || item.code) }}
                                                    style={StyleSheet.absoluteFill}
                                                    resizeMode="cover"
                                                />
                                                {!isDark && (
                                                    <LinearGradient
                                                        colors={['transparent', 'rgba(0,0,0,0.5)']}
                                                        style={StyleSheet.absoluteFill}
                                                    />
                                                )}

                                                <View style={styles.gridBadge}>
                                                    <Text style={styles.gridBadgeText}>
                                                        Year {item.year || selectedYear}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.gridContent}>
                                                <Text style={[styles.cardCode, { color: isDark ? theme.colors.primary : theme.colors.primary, fontSize: 10 }]}>
                                                    {item.code}
                                                </Text>
                                                <Text
                                                    style={[styles.cardName, { color: isDark ? '#fff' : theme.colors.onSurface, fontSize: 13 }]}
                                                    numberOfLines={2}
                                                >
                                                    {item.name}
                                                </Text>
                                                <View style={styles.resourceCount}>
                                                    <Icon name="file-document-outline" size={10} color={isDark ? 'rgba(255,255,255,0.5)' : theme.colors.outline} />
                                                    <Text style={[styles.resourceCountText, { color: isDark ? 'rgba(255,255,255,0.5)' : theme.colors.outline, fontSize: 9 }]}>
                                                        {getResourceCount(item)} {getResourceCount(item) === 1 ? 'File' : 'Files'}
                                                    </Text>
                                                </View>
                                            </View>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* 4. Improved Search Results Bottom-Sheet Modal */}
            {isSearchModalVisible && (
                <View style={StyleSheet.absoluteFill}>
                    <TouchableOpacity
                        style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
                        activeOpacity={1}
                        onPress={() => {
                            setIsSearchModalVisible(false);
                            setSearchQuery('');
                        }}
                    />
                    <Animated.View
                        entering={FadeInUp.springify()}
                        exiting={FadeOut.duration(200)}
                        style={[
                            styles.searchModal,
                            {
                                backgroundColor: isDark ? '#1E1E1E' : '#fff',
                                top: insets.top + 70,
                                height: height - insets.top - 100,
                            }
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHandle} />
                            <TouchableOpacity
                                onPress={() => {
                                    setIsSearchModalVisible(false);
                                    setSearchQuery('');
                                }}
                                style={styles.closeModalBtn}
                            >
                                <Icon name="close" size={24} color={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.modalTitle, { color: theme.colors.primary }]}>Search Results</Text>

                        {isLoading ? (
                            <View style={styles.modalLoader}>
                                <ActivityIndicator color={theme.colors.primary} />
                            </View>
                        ) : searchQuery.length > 0 && filteredResults.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Icon name="magnify-close" size={48} color={theme.colors.outline} />
                                <Text style={[styles.emptyStateText, { color: theme.colors.onSurfaceVariant }]}>
                                    No units found for "{searchQuery}"
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredResults}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={styles.modalList}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.searchResultItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}
                                        onPress={() => {
                                            setIsSearchModalVisible(false);
                                            navigation.navigate('CourseDetails', { course: item });
                                        }}
                                    >
                                        <View style={[styles.resultImageContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                                            <Image
                                                source={{ uri: getCourseImage(item?.id || item?.code || 'default') }}
                                                style={styles.resultImage}
                                            />
                                        </View>
                                        <View style={styles.resultInfo}>
                                            <Text style={[styles.resultCode, { color: theme.colors.primary }]}>{item?.code || 'CODE'}</Text>
                                            <Text style={[styles.resultName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>{item?.name || 'Unit Name'}</Text>
                                            <Text style={[styles.resultDetails, { color: theme.colors.outline }]}>
                                                Year {item?.year || '-'} • {getResourceCount(item)} Resources
                                            </Text>
                                        </View>
                                        <Icon name="chevron-right" size={20} color={theme.colors.outline} />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </Animated.View>
                </View>
            )}

            {/* QUICK PROFILE OVERLAY (Innovative Interaction) */}
            {
                showProfileCard && (
                    <View style={StyleSheet.absoluteFill}>
                        <TouchableOpacity
                            style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                            activeOpacity={1}
                            onPress={() => setShowProfileCard(false)}
                        />
                        <View style={styles.profileCardWrapper}>
                            <Animated.View
                                entering={ZoomIn.springify()}
                                exiting={ZoomOut}
                                style={[
                                    styles.profileCard,
                                    {
                                        backgroundColor: isDark ? '#262626' : theme.colors.surface,
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : theme.colors.outlineVariant,
                                    }
                                ]}
                            >
                                {/* Banner Image Background - Top Section Only */}
                                <View style={styles.cardBannerContainer}>
                                    <Image
                                        source={{ uri: user?.banner_url || DEFAULT_BANNER }}
                                        style={[styles.cardBannerImage]}
                                        resizeMode="cover"
                                    />
                                    <BlurView
                                        style={styles.cardBannerImage}
                                        blurType={isDark ? "dark" : "light"}
                                        blurAmount={3}
                                        reducedTransparencyFallbackColor="transparent"
                                    />
                                    {/* Dark Overlay for better text visibility */}
                                    <View style={[styles.cardBannerOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.25)' }]} />
                                </View>

                                <TouchableOpacity
                                    style={styles.closeCardBtn}
                                    onPress={() => setShowProfileCard(false)}
                                >
                                    <Icon name="close" size={20} color="rgba(255,255,255,0.8)" />
                                </TouchableOpacity>

                                <View style={styles.cardHeader}>
                                    <View style={[styles.largeAvatar, { backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' }]}>
                                        {user?.avatar_url ? (
                                            <Image source={{ uri: user.avatar_url }} style={styles.largeAvatarImage} />
                                        ) : (
                                            <Icon name="account" size={40} color={theme.colors.primary} />
                                        )}
                                    </View>
                                    <Text style={[styles.profileCardName, { color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }]}>
                                        {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Student'}
                                    </Text>
                                    <Text style={[styles.cardUsername, { color: 'rgba(255,255,255,0.85)', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>
                                        @{user?.username || 'student'}
                                    </Text>
                                    <Text style={[styles.cardEmail, { color: 'rgba(255,255,255,0.75)', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }]}>
                                        {user?.email || 'student@example.com'}
                                    </Text>
                                </View>

                                <View style={[styles.cardSeparator, { backgroundColor: theme.colors.outlineVariant }]} />

                                <View style={styles.cardDetails}>
                                    <View style={styles.detailItem}>
                                        <Icon name="school" size={18} color={theme.colors.outline} />
                                        <View style={styles.detailTextContainer}>
                                            <Text style={[styles.detailLabel, { color: theme.colors.outline }]}>Program</Text>
                                            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]} numberOfLines={1}>{user?.program?.name || 'Not Assigned'}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <Icon name="office-building" size={18} color={theme.colors.outline} />
                                        <View style={styles.detailTextContainer}>
                                            <Text style={[styles.detailLabel, { color: theme.colors.outline }]}>Faculty</Text>
                                            <Text style={[styles.detailValue, { color: theme.colors.onSurface }]} numberOfLines={1}>{user?.faculty?.name || 'Information Technology'}</Text>
                                        </View>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.viewProfileBtn, { backgroundColor: theme.colors.primary }]}
                                    onPress={() => {
                                        setShowProfileCard(false);
                                        navigation.navigate('Profile');
                                    }}
                                >
                                    <Text style={styles.viewProfileBtnText}>View Full Profile</Text>
                                    <Icon name="arrow-right" size={16} color="#fff" />
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>
                )
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { 
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 60 : 50,
    },
    // Profile & Course Section
    profileCourseSection: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            }
        })
    },
    profileInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarGlow: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        opacity: 0.2,
    },
    avatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    avatarImg: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    connectivityDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
    },
    infoColumn: {
        flex: 1,
        gap: 4,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    courseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    courseBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    courseBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    courseDetails: {
        fontSize: 13,
        flex: 1,
    },
    academicInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoChipText: {
        fontSize: 11,
        fontWeight: '500',
    },
    offlineTag: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'center',
    },
    offlineTagText: {
        color: '#F87171',
        fontSize: 11,
        fontWeight: '600',
    },
    // Floating Search Bar
    floatingSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 25,
        paddingHorizontal: 16,
        marginBottom: 20,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            }
        })
    },
    floatingSearchInput: {
        flex: 1,
        fontSize: 14,
        marginLeft: 10,
        padding: 0,
    },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    chipGroup: { flexDirection: 'row', marginBottom: 15 },
    chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
    chipText: { fontSize: 13, fontWeight: '700' },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 5,
    },
    // Search Modal Styles
    searchModal: {
        position: 'absolute',
        left: 0,
        right: 0,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 20,
        elevation: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalHeader: {
        alignItems: 'center',
        paddingVertical: 12,
        position: 'relative',
    },
    modalHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    closeModalBtn: {
        position: 'absolute',
        right: 0,
        top: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 15,
    },
    modalLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalList: {
        paddingBottom: 40,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        marginBottom: 10,
        gap: 12,
    },
    resultImageContainer: {
        width: 50,
        height: 50,
        borderRadius: 10,
        overflow: 'hidden',
    },
    resultImage: {
        width: '100%',
        height: '100%',
    },
    resultInfo: {
        flex: 1,
    },
    resultCode: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    resultName: {
        fontSize: 14,
        fontWeight: '700',
    },
    resultDetails: {
        fontSize: 11,
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyStateText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    viewSwitcher: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 4,
        gap: 4,
    },
    switchBtn: {
        padding: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        flex: 1,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    gridInfo: {
        alignItems: 'center',
    },
    sectionTitle: { fontSize: 18, fontWeight: '900' },
    loader: { height: 100, justifyContent: 'center' },

    // NEW REDESIGNED CARD STYLES
    card: {
        height: 100,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    cardTouchable: {
        flexDirection: 'row',
        flex: 1,
    },
    listImageContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#eee',
    },
    listImage: {
        width: '100%',
        height: '100%',
    },
    listContent: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        justifyContent: 'space-between',
    },
    listBadgeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 4,
        alignItems: 'center',
    },
    listBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    gridCard: {
        width: (width - 52) / 2,
        height: 180,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        marginBottom: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    gridImageContainer: {
        height: '50%',
        width: '100%',
        backgroundColor: '#eee',
    },
    gridContent: {
        padding: 10,
        flex: 1,
        justifyContent: 'space-between',
    },
    gridBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    gridBadgeText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '900',
    },
    cardImageContainer: {
        height: '55%',
        width: '100%',
        backgroundColor: '#eee',
    },
    cardContent: {
        padding: 16,
        paddingTop: 12,
        flex: 1,
        justifyContent: 'space-between',
    },
    cardCode: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    cardName: {
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 20,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    resourceCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    resourceCountText: {
        fontSize: 11,
        fontWeight: '600',
    },
    floatingBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    floatingBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },

    // QUICK PROFILE CARD STYLES
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    profileCardAnchor: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    profileCardWrapper: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    profileCard: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        elevation: 20,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
    },
    cardBannerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 220,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    cardBannerImage: {
        width: '100%',
        height: '100%',
    },
    cardBannerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    cardGlow: {
        ...StyleSheet.absoluteFillObject,
    },
    closeCardBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
        zIndex: 10,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 20,
        zIndex: 5,
    },
    largeAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    largeAvatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    profileCardName: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 4,
    },
    cardUsername: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    cardEmail: {
        fontSize: 12,
        fontWeight: '500',
    },
    cardSeparator: {
        height: 1,
        width: '100%',
        marginBottom: 20,
    },
    cardDetails: {
        gap: 16,
        marginBottom: 24,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailTextContainer: {
        marginLeft: 12,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '700',
        marginTop: 1,
    },
    viewProfileBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        borderRadius: 12,
        gap: 8,
    },
    viewProfileBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default HomeScreen;
