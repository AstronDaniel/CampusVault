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

    const getResourceCount = (item: any) => {
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

    // Search Autocomplete Logic
    useEffect(() => {
        if (searchQuery.length < 2) {
            setFilteredResults([]);
            setIsSearchModalVisible(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                if (isOnline && user?.program_id) {
                    setIsLoading(true);
                    const response = await authService.searchProgramUnits(user.program_id, searchQuery);
                    // Force array type and filter out any non-objects
                    const results = Array.isArray(response) ? response : [];
                    setFilteredResults(results);
                    setIsLoading(false);
                }
            } catch (e) {
                console.error('Autocomplete error', e);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, isOnline]);

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
            {/* 1. Header with Dynamic Background */}
            <View style={styles.headerContainer}>
                {user?.banner_url ? (
                    <>
                        <Image
                            source={{ uri: user.banner_url }}
                            style={[StyleSheet.absoluteFill, { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' }]}
                            resizeMode="cover"
                        />
                        <BlurView
                            style={StyleSheet.absoluteFill}
                            blurType={isDark ? "dark" : "light"}
                            blurAmount={8}
                            reducedTransparencyFallbackColor="transparent"
                        />
                    </>
                ) : (
                    <LinearGradient
                        colors={isDark ? ['#161E2E', '#0B0F1A'] : [theme.colors.primary, theme.colors.primaryContainer]}
                        style={[StyleSheet.absoluteFill, { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' }]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                )}

                <View style={[styles.headerOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(79, 70, 229, 0.15)', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, overflow: 'hidden' }]} />

                <Animated.View
                    entering={FadeInUp.duration(600)}
                    style={styles.headerContent}
                >
                    {/* LEFT: Profile & Tooltip Username */}
                    <TouchableOpacity
                        style={styles.leftSection}
                        onPress={() => setShowProfileCard(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.profileWrapper}>
                            <View style={[styles.profileGlow, { backgroundColor: theme.colors.primary }]} />
                            <View style={[styles.ivUserProfile, { backgroundColor: theme.colors.surfaceVariant }]}>
                                {user?.avatar_url ? (
                                    <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
                                ) : (
                                    <Icon name="account" size={26} color={isDark ? "#fff" : theme.colors.primary} />
                                )}
                            </View>
                            {/* Connectivity Dot */}
                            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#4ADE80' : '#F87171' }]} />
                        </View>
                        <View style={styles.tooltipContainer}>
                            <Text style={styles.tvUsernameLabel} numberOfLines={1}>Hi, {user?.username || 'Student'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* CENTER: Search Bar */}
                    <View style={styles.centerContainer}>
                        <View style={[styles.centerSection, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <Icon name="magnify" size={18} color="rgba(255,255,255,0.6)" />
                            <TextInput
                                placeholder="Find units..."
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                style={styles.headerSearchInput}
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
                                    <Icon name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>
                            )}
                        </View>

                    </View>

                    {/* RIGHT: Abbreviations/Badges */}
                    <View style={[styles.rightSection, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[styles.tvProgramBadge, { color: isDark ? theme.colors.primary : '#fff' }]}>
                            {programCode}
                        </Text>
                        <Text style={styles.tvFacultyBadge}>{facultyCode}</Text>
                    </View>
                </Animated.View>

                {/* Offline Mode Badge */}
                {isFromCache && (
                    <Animated.View entering={FadeInUp} style={styles.offlineBadge}>
                        <Icon name="wifi-off" size={10} color="#fff" />
                        <Text style={styles.offlineBadgeText}>Offline Mode (Cached Data)</Text>
                    </Animated.View>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
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
                                {/* TRUE GLASS BLUR */}
                                <BlurView
                                    style={StyleSheet.absoluteFill}
                                    blurType={isDark ? "dark" : "light"}
                                    blurAmount={15}
                                    reducedTransparencyFallbackColor="white"
                                />

                                {/* Glassy Surface Gradient */}
                                <LinearGradient
                                    colors={[
                                        isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)',
                                        isDark ? 'rgba(255,255,255,0)' : 'rgba(255,255,255,0.05)'
                                    ]}
                                    style={StyleSheet.absoluteFill}
                                />

                                {/* Inner Glass Glow */}
                                <View style={[styles.cardGlow, { backgroundColor: theme.colors.primary, opacity: 0.1 }]} />

                                <TouchableOpacity
                                    style={styles.closeCardBtn}
                                    onPress={() => setShowProfileCard(false)}
                                >
                                    <Icon name="close" size={20} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)"} />
                                </TouchableOpacity>

                                <View style={styles.cardHeader}>
                                    <View style={[styles.largeAvatar, { backgroundColor: theme.colors.primaryContainer }]}>
                                        {user?.avatar_url ? (
                                            <Image source={{ uri: user.avatar_url }} style={styles.largeAvatarImage} />
                                        ) : (
                                            <Icon name="account" size={40} color={theme.colors.primary} />
                                        )}
                                    </View>
                                    <Text style={[styles.profileCardName, { color: isDark ? '#fff' : '#000' }]}>{user?.name || 'Student Name'}</Text>
                                    <Text style={[styles.cardUsername, { color: theme.colors.primary }]}>@{user?.username || 'student'}</Text>
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
    headerContainer: {
        zIndex: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 15,
            },
            android: {
                elevation: 15,
            }
        })
    },
    headerImage: {
        opacity: 0.9,
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 25,
        paddingTop: 20,
    },
    leftSection: {
        alignItems: 'center',
        width: 60,
    },
    profileWrapper: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileGlow: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        opacity: 0.3,
    },
    ivUserProfile: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'white',
    },
    avatarImage: {
        width: 38,
        height: 38,
        borderRadius: 19,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: 'white',
    },
    offlineBadge: {
        position: 'absolute',
        top: 60,
        alignSelf: 'center',
        backgroundColor: '#F87171',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 6,
        zIndex: 100,
    },
    offlineBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    tooltipContainer: {
        marginTop: 4,
        paddingHorizontal: 6,
        paddingVertical: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
    },
    tvUsernameLabel: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '700',
        maxWidth: 55,
        textAlign: 'center',
    },
    centerContainer: {
        flex: 1,
        marginHorizontal: 10,
        zIndex: 50,
    },
    centerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 12,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 15,
        padding: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
    },
    suggestionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    headerSearchInput: {
        flex: 1,
        color: '#fff',
        fontSize: 12,
        marginLeft: 5,
        padding: 0,
    },
    rightSection: {
        width: 65,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tvProgramBadge: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    tvFacultyBadge: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginTop: -1,
    },
    scrollContent: { padding: 20 },
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
    cardGlow: {
        ...StyleSheet.absoluteFillObject,
    },
    closeCardBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 4,
    },
    cardHeader: {
        alignItems: 'center',
        marginBottom: 20,
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
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 4,
    },
    cardUsername: {
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.8,
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
