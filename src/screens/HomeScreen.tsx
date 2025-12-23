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
} from 'react-native';
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

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: { navigation: any }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const isDark = theme.dark;

    // UI State
    const [selectedYear, setSelectedYear] = useState(1);
    const [selectedSemester, setSelectedSemester] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileCard, setShowProfileCard] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Data State
    const [courseUnits, setCourseUnits] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Real Data Loading
    const loadCourseUnits = useCallback(async () => {
        if (!user?.program_id) return;

        setIsLoading(true);
        try {
            const data = await authService.getCourseUnits(
                user.program_id,
                selectedYear,
                selectedSemester
            );

            // Filter locally for now
            const filtered = data.filter((item: any) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.code.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setCourseUnits(filtered);
        } catch (error) {
            console.error('Failed to load course units', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear, selectedSemester, searchQuery, user?.program_id]);

    useEffect(() => {
        loadCourseUnits();
    }, [loadCourseUnits]);

    const programCode = user?.program?.code || 'BSC';
    const facultyCode = user?.faculty?.name?.split(' ').map((w: string) => w[0]).join('').toUpperCase() || 'COCIS';

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* 1. Header with Image Background */}
            <View style={styles.headerContainer}>
                <ImageBackground
                    source={IMAGES.DASHBOARD_BACKGROUND}
                    style={StyleSheet.absoluteFill}
                    imageStyle={styles.headerImage}
                />
                <View style={[styles.headerOverlay, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(79, 70, 229, 0.4)' }]} />

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
                                <Icon name="account" size={26} color={isDark ? "#fff" : theme.colors.primary} />
                            </View>
                        </View>
                        <View style={styles.tooltipContainer}>
                            <Text style={styles.tvUsernameLabel} numberOfLines={1}>Hi, {user?.username || 'Student'}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* CENTER: Search Bar */}
                    <View style={[styles.centerSection, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                        <Icon name="magnify" size={18} color="rgba(255,255,255,0.6)" />
                        <TextInput
                            placeholder="Find units..."
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            style={styles.headerSearchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* RIGHT: Abbreviations/Badges */}
                    <View style={[styles.rightSection, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[styles.tvProgramBadge, { color: isDark ? theme.colors.primary : '#fff' }]}>
                            {programCode}
                        </Text>
                        <Text style={styles.tvFacultyBadge}>{facultyCode}</Text>
                    </View>
                </Animated.View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 2. Selectors with Staggered Entrance */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={[styles.label, { color: theme.colors.onBackground }]}>Select Year</Text>
                    <View style={styles.chipGroup}>
                        {[1, 2, 3, 4].map(y => (
                            <TouchableOpacity
                                key={y}
                                onPress={() => setSelectedYear(y)}
                                style={[
                                    styles.chip,
                                    selectedYear === y ? { backgroundColor: theme.colors.primary } : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.colors.surfaceVariant }
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: selectedYear === y ? '#fff' : (isDark ? 'rgba(255,255,255,0.6)' : theme.colors.onSurfaceVariant) }
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
                                    selectedSemester === s ? { backgroundColor: theme.colors.secondary } : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.colors.surfaceVariant }
                                ]}
                            >
                                <Text style={[
                                    styles.chipText,
                                    { color: selectedSemester === s ? '#fff' : (isDark ? 'rgba(255,255,255,0.6)' : theme.colors.onSurfaceVariant) }
                                ]}>Sem {s}</Text>
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

                    {/* Innovative View Switcher */}
                    <View style={[styles.viewSwitcher, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.colors.surfaceVariant }]}>
                        <TouchableOpacity
                            onPress={() => setViewMode('list')}
                            style={[styles.switchBtn, viewMode === 'list' && { backgroundColor: theme.colors.primary }]}
                        >
                            <Icon name="format-list-bulleted" size={18} color={viewMode === 'list' ? '#fff' : (isDark ? 'rgba(255,255,255,0.4)' : theme.colors.outline)} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setViewMode('grid')}
                            style={[styles.switchBtn, viewMode === 'grid' && { backgroundColor: theme.colors.primary }]}
                        >
                            <Icon name="view-grid" size={18} color={viewMode === 'grid' ? '#fff' : (isDark ? 'rgba(255,255,255,0.4)' : theme.colors.outline)} />
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
                                entering={FadeInDown.delay(500 + index * 50).springify()}
                                style={viewMode === 'list' ? [
                                    styles.card,
                                    {
                                        backgroundColor: isDark ? '#1E293B' : theme.colors.surface,
                                        borderColor: theme.colors.outlineVariant,
                                        elevation: isDark ? 0 : 2
                                    }
                                ] : [
                                    styles.gridCard,
                                    {
                                        backgroundColor: isDark ? '#1E293B' : theme.colors.surface,
                                        borderColor: theme.colors.outlineVariant,
                                        width: (width - 52) / 2, // 20 padding * 2 + 12 gap = 52
                                    }
                                ]}
                            >
                                <View style={viewMode === 'list' ?
                                    [styles.iconBox, { backgroundColor: theme.colors.primaryContainer }] :
                                    [styles.gridIconBox, { backgroundColor: theme.colors.primaryContainer }]
                                }>
                                    <Icon name="book" size={viewMode === 'list' ? 24 : 32} color={theme.colors.primary} />
                                </View>

                                <View style={viewMode === 'list' ? styles.info : styles.gridInfo}>
                                    <Text style={[styles.code, { color: theme.colors.primary }]}>{item.code}</Text>
                                    <Text
                                        style={[styles.name, { color: theme.colors.onSurface }]}
                                        numberOfLines={viewMode === 'grid' ? 2 : 1}
                                    >
                                        {item.name}
                                    </Text>
                                </View>

                                {viewMode === 'list' && (
                                    <Icon name="chevron-right" size={20} color={theme.colors.outline} />
                                )}
                            </Animated.View>
                        ))}
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* QUICK PROFILE OVERLAY (Innovative Interaction) */}
            {
                showProfileCard && (
                    <View style={StyleSheet.absoluteFill}>
                        <Animated.View
                            entering={FadeInUp.duration(300)}
                            exiting={FadeOut.duration(200)}
                            style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}
                        >
                            <TouchableOpacity
                                style={StyleSheet.absoluteFill}
                                onPress={() => setShowProfileCard(false)}
                                activeOpacity={1}
                            />
                        </Animated.View>

                        <View style={styles.profileCardAnchor}>
                            <Animated.View
                                entering={ZoomIn.springify().damping(15)}
                                exiting={ZoomOut.duration(200)}
                                style={[
                                    styles.profileCard,
                                    {
                                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.7)',
                                        borderColor: 'rgba(255, 255, 255, 0.2)',
                                        shadowColor: theme.colors.primary,
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
                                        <Icon name="account" size={40} color={theme.colors.primary} />
                                    </View>
                                    <Text style={[styles.cardName, { color: isDark ? '#fff' : '#000' }]}>{user?.name || 'Student Name'}</Text>
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
        overflow: 'hidden',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
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
    centerSection: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        borderRadius: 20,
        paddingHorizontal: 12,
        marginHorizontal: 10,
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
    sectionTitle: { fontSize: 18, fontWeight: '900', marginVertical: 15 },
    loader: { height: 100, justifyContent: 'center' },
    list: { gap: 12 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 18,
        borderWidth: 1,
    },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    info: { flex: 1 },
    code: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
    name: { fontSize: 14, fontWeight: '700' },

    // SECTION HEADER & SWITCHER
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 15,
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
    },

    // LIST & GRID LAYOUTS
    list: { gap: 12 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    gridCard: {
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    gridIconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    gridInfo: {
        alignItems: 'center',
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
        marginBottom: 12,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    cardName: {
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 2,
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
