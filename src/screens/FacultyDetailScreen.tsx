import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { useTheme, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 260;

const FacultyDetailScreen = ({ route, navigation }: any) => {
    const { faculty } = route.params;
    const theme = useTheme();
    const isDark = theme.dark;

    const [programs, setPrograms] = useState<any[]>([]);
    const [filteredPrograms, setFilteredPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const scrollY = useSharedValue(0);

    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        setLoading(true);
        try {
            const response = await authService.getPrograms(faculty.id);
            const data = Array.isArray(response) ? response : (response?.items || []);
            setPrograms(data);
            setFilteredPrograms(data);
        } catch (error) {
            console.error('Failed to load programs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredPrograms(programs);
            return;
        }
        const filtered = programs.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            (p.code && p.code.toLowerCase().includes(query.toLowerCase()))
        );
        setFilteredPrograms(filtered);
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
        return { opacity };
    });

    const getFacultyImage = (id: any) => {
        return `https://picsum.photos/seed/faculty_${id}/800/600`;
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F9FAFB' }]}>
            {/* STICKY PARALLAX HEADER */}
            <Animated.View style={[styles.header, headerStyle, { backgroundColor: isDark ? '#050505' : theme.colors.surface }]}>
                <Image
                    source={{ uri: getFacultyImage(faculty.id) }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)', isDark ? '#000000' : '#F9FAFB']}
                    style={StyleSheet.absoluteFill}
                />

                <View style={[styles.navBar, { paddingTop: 50 }]}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.roundBtn, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
                    >
                        <Icon name="arrow-left" size={24} color="#fff" />
                    </TouchableOpacity>

                    <Animated.Text style={[styles.navTitle, headerTitleStyle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                        {faculty.name}
                    </Animated.Text>

                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.headerContent}>
                    <Text style={styles.facultyCodeLabel}>{faculty.code || 'FACULTY'}</Text>
                    <Text style={[styles.facultyName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                        {faculty.name}
                    </Text>
                    <View style={styles.statsRow}>
                        <View style={styles.headerStat}>
                            <Icon name="school-outline" size={16} color={theme.colors.primary} />
                            <Text style={[styles.statText, { color: isDark ? 'rgba(255,255,255,0.7)' : theme.colors.outline }]}>
                                {faculty.programs_count || programs.length} Programs
                            </Text>
                        </View>
                    </View>
                </View>
            </Animated.View>

            <Animated.ScrollView
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPrograms(); }} />
                }
            >
                {/* SEARCH SECTION */}
                <View style={styles.searchSection}>
                    <Searchbar
                        placeholder="Search programs..."
                        onChangeText={handleSearch}
                        value={searchQuery}
                        style={[styles.searchBar, { backgroundColor: isDark ? '#0A0A0A' : '#fff', borderColor: isDark ? '#1F1F1F' : 'transparent' }]}
                        inputStyle={{ color: isDark ? '#fff' : '#000' }}
                        iconColor={isDark ? 'rgba(255,255,255,0.5)' : theme.colors.outline}
                    />
                </View>

                {/* PROGRAMS LIST */}
                <View style={styles.listContainer}>
                    {loading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                    ) : filteredPrograms.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="folder-outline" size={64} color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                            <Text style={{ color: theme.colors.outline, marginTop: 10 }}>No programs found</Text>
                        </View>
                    ) : (
                        filteredPrograms.map((item, index) => (
                            <Animated.View
                                key={item.id}
                                entering={FadeInDown.delay(index * 100)}
                            >
                                <TouchableOpacity
                                    style={[styles.programCard, { backgroundColor: isDark ? '#0A0A0A' : '#fff', borderColor: isDark ? '#1F1F1F' : 'rgba(0,0,0,0.05)' }]}
                                    onPress={() => navigation.navigate('ProgramDetail', { program: item })}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '15' }]}>
                                        <Icon name="book-education-outline" size={26} color={theme.colors.primary} />
                                    </View>

                                    <View style={styles.programInfo}>
                                        <Text style={[styles.programName, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
                                        <Text style={[styles.programCode, { color: theme.colors.outline }]}>
                                            {item.code} • {item.duration_years || 3} Years
                                        </Text>
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
        fontSize: 16,
        fontWeight: '900',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 15,
    },
    headerContent: {
        position: 'absolute',
        bottom: 25,
        left: 20,
        right: 20,
    },
    facultyCodeLabel: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 8,
    },
    facultyName: {
        fontSize: 26,
        fontWeight: '900',
        lineHeight: 32,
        marginBottom: 10,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    scrollContent: {
        paddingTop: HEADER_HEIGHT + 20,
    },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchBar: {
        borderRadius: 15,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    programCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    programInfo: {
        flex: 1,
        marginLeft: 16,
    },
    programName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    programCode: {
        fontSize: 12,
        fontWeight: '600',
    },
    loader: {
        marginTop: 50,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 50,
    },
});

export default FacultyDetailScreen;
