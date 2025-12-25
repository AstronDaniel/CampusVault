import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { useTheme, Searchbar, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

const ExploreScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

    const [faculties, setFaculties] = useState<any[]>([]);
    const [filteredFaculties, setFilteredFaculties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadFaculties();
    }, []);

    const loadFaculties = async () => {
        setLoading(true);
        try {
            const response = await authService.getFaculties();
            const data = Array.isArray(response) ? response : (response?.items || []);
            setFaculties(data);
            setFilteredFaculties(data);
        } catch (error) {
            console.error('Failed to load faculties:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredFaculties(faculties);
            return;
        }
        const filtered = faculties.filter(f =>
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            (f.code && f.code.toLowerCase().includes(query.toLowerCase()))
        );
        setFilteredFaculties(filtered);
    };

    const getFacultyColor = (index: number) => {
        const colors = [
            ['#6366F1', '#8B5CF6'], // Indigo-Purple
            ['#0EA5E9', '#06B6D4'], // Blue-Cyan
            ['#10B981', '#34D399'], // Emerald-Green
            ['#F59E0B', '#FBBF24'], // Amber-Yellow
            ['#EF4444', '#F97316'], // Red-Orange
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

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
            {/* HERO HEADER */}
            <LinearGradient
                colors={isDark ? ['#1E1E1E', '#121212'] : [theme.colors.primary, '#6366F1']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <Animated.Text entering={FadeInUp.delay(200)} style={styles.headerTitle}>Explore</Animated.Text>
                    <Animated.Text entering={FadeInUp.delay(300)} style={styles.headerSubtitle}>
                        Select a faculty to browse programs and specialized resources.
                    </Animated.Text>
                </View>

                <Animated.View entering={FadeInUp.delay(400)} style={styles.searchContainer}>
                    <Searchbar
                        placeholder="Search for faculties..."
                        onChangeText={handleSearch}
                        value={searchQuery}
                        style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]}
                        inputStyle={{ color: isDark ? '#fff' : '#000' }}
                        iconColor={isDark ? 'rgba(255,255,255,0.5)' : theme.colors.outline}
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : theme.colors.outline}
                    />
                </Animated.View>
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFaculties(); }} />
                }
            >
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                        {searchQuery ? `Search Results (${filteredFaculties.length})` : `All Faculties (${faculties.length})`}
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                ) : filteredFaculties.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="school-outline" size={80} color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                        <Text style={[styles.emptyText, { color: theme.colors.outline }]}>No faculties found</Text>
                    </View>
                ) : (
                    filteredFaculties.map((item, index) => (
                        <Animated.View
                            key={item.id}
                            entering={FadeInDown.delay(index * 100)}
                        >
                            <TouchableOpacity
                                style={[styles.facultyCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}
                                onPress={() => navigation.navigate('FacultyDetail', { faculty: item })}
                                activeOpacity={0.7}
                            >
                                <LinearGradient
                                    colors={getFacultyColor(index)}
                                    style={styles.facultyIcon}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Icon name={getFacultyIcon(item.name)} size={28} color="#fff" />
                                </LinearGradient>

                                <View style={styles.facultyInfo}>
                                    <Text style={[styles.facultyName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.facultyCode, { color: theme.colors.outline }]}>
                                        {item.code || 'FAC'} • {item.programs_count || 0} Programs
                                    </Text>
                                </View>

                                <View style={[styles.arrowContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F3F4F6' }]}>
                                    <Icon name="chevron-right" size={20} color={theme.colors.outline} />
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    ))
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 5,
        lineHeight: 22,
    },
    searchContainer: {
        marginTop: 10,
    },
    searchBar: {
        borderRadius: 15,
        elevation: 0,
        height: 50,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    facultyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 20,
        marginBottom: 16,
        // Elevation for light mode
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    facultyIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    facultyInfo: {
        flex: 1,
        marginLeft: 16,
    },
    facultyName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    facultyCode: {
        fontSize: 12,
        fontWeight: '600',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        marginTop: 50,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ExploreScreen;
