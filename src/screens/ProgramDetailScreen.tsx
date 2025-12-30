import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { useTheme, Surface } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

const ProgramDetailScreen = ({ route, navigation }: any) => {
    const { program } = route.params;
    const theme = useTheme();
    const isDark = theme.dark;

    const [courseUnits, setCourseUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    useEffect(() => {
        loadCourseUnits();
    }, []);

    const loadCourseUnits = async () => {
        setLoading(true);
        try {
            const response = await authService.getCourseUnits(program.id);
            const data = Array.isArray(response) ? response : (response?.items || []);
            setCourseUnits(data);

            // Default expand first section
            if (data.length > 0) {
                const firstKey = `${data[0].year}-${data[0].semester}`;
                setExpandedSections([firstKey]);
            }
        } catch (error) {
            console.error('Failed to load course units:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleSection = (key: string) => {
        setExpandedSections(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    // Grouping logic
    const groupedData: any = {};
    courseUnits.forEach(unit => {
        const key = `${unit.year}-${unit.semester}`;
        if (!groupedData[key]) {
            groupedData[key] = {
                year: unit.year,
                semester: unit.semester,
                units: []
            };
        }
        groupedData[key].units.push(unit);
    });

    const sortedGroups = Object.keys(groupedData).sort().map(key => groupedData[key]);

    const getYearColors = (year: number) => {
        const colors = [
            ['#6366F1', '#8B5CF6'], // Year 1
            ['#0EA5E9', '#06B6D4'], // Year 2
            ['#10B981', '#34D399'], // Year 3
            ['#F59E0B', '#FBBF24'], // Year 4
            ['#EF4444', '#F97316'], // Year 5
        ];
        return colors[(year - 1) % colors.length];
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                <View style={styles.navRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.navTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                        Program Details
                    </Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.heroBlock}>
                    <Text style={styles.programCode}>{program.code || 'PROG'}</Text>
                    <Text style={[styles.programName, { color: isDark ? '#fff' : '#000' }]}>{program.name}</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.infoBadge}>
                            <Icon name="calendar-clock" size={14} color={theme.colors.primary} />
                            <Text style={[styles.infoText, { color: theme.colors.outline }]}>
                                {program.duration_years || 3} Years Duration
                            </Text>
                        </View>
                        <View style={styles.dot} />
                        <View style={styles.infoBadge}>
                            <Icon name="book-outline" size={14} color="#10B981" />
                            <Text style={[styles.infoText, { color: theme.colors.outline }]}>
                                {courseUnits.length} Units
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadCourseUnits(); }} />
                }
            >
                {loading ? (
                    <View style={styles.loader}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={[styles.loaderText, { color: theme.colors.outline }]}>Building your curriculum...</Text>
                    </View>
                ) : sortedGroups.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="book-open-outline" size={80} color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                        <Text style={[styles.emptyText, { color: theme.colors.outline }]}>No course units listed yet</Text>
                    </View>
                ) : (
                    sortedGroups.map((group, gIndex) => {
                        const key = `${group.year}-${group.semester}`;
                        const isExpanded = expandedSections.includes(key);
                        const colors = getYearColors(group.year);

                        return (
                            <View key={key} style={styles.sectionWrapper}>
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => toggleSection(key)}
                                    style={styles.sectionHeader}
                                >
                                    <Surface style={[styles.semesterCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                                        <LinearGradient
                                            colors={colors}
                                            style={styles.yearIndicator}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.yearNum}>{group.year}</Text>
                                        </LinearGradient>

                                        <View style={styles.semesterInfo}>
                                            <Text style={[styles.semesterTitle, { color: isDark ? '#fff' : '#000' }]}>
                                                Year {group.year} • Semester {group.semester}
                                            </Text>
                                            <Text style={[styles.unitCount, { color: theme.colors.outline }]}>
                                                {group.units.length} Course Units
                                            </Text>
                                        </View>

                                        <Icon
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={24}
                                            color={theme.colors.outline}
                                        />
                                    </Surface>
                                </TouchableOpacity>

                                {isExpanded && (
                                    <Animated.View layout={Layout.springify()} style={styles.unitsGrid}>
                                        {group.units.map((unit: any, uIndex: number) => (
                                            <TouchableOpacity
                                                key={unit.id}
                                                style={[styles.unitItem, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}
                                                onPress={() => navigation.navigate('CourseDetails', { course: unit })}
                                            >
                                                <View style={[styles.unitIconBox, { backgroundColor: colors[0] + '15' }]}>
                                                    <Text style={[styles.unitCode, { color: colors[0] }]}>{unit.code?.substring(0, 2)}</Text>
                                                </View>
                                                <Text style={[styles.unitName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={2}>
                                                    {unit.name}
                                                </Text>
                                                <View style={styles.unitMeta}>
                                                    <Text style={[styles.unitCodeFull, { color: theme.colors.outline }]}>{unit.code}</Text>
                                                    <View style={styles.miniDot} />
                                                    <Icon name="chevron-right" size={14} color={theme.colors.outline} />
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </Animated.View>
                                )}
                            </View>
                        );
                    })
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    heroBlock: {
        marginTop: 10,
    },
    programCode: {
        color: '#10B981',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    programName: {
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 30,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        fontWeight: '600',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 12,
    },
    scrollContent: {
        padding: 20,
    },
    sectionWrapper: {
        marginBottom: 16,
    },
    sectionHeader: {
        zIndex: 2,
    },
    semesterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        elevation: 2,
    },
    yearIndicator: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    yearNum: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '900',
    },
    semesterInfo: {
        flex: 1,
        marginLeft: 16,
    },
    semesterTitle: {
        fontSize: 15,
        fontWeight: '800',
        marginBottom: 2,
    },
    unitCount: {
        fontSize: 12,
        fontWeight: '600',
    },
    unitsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingTop: 12,
        paddingHorizontal: 4,
    },
    unitItem: {
        width: (width - 60) / 2,
        padding: 16,
        borderRadius: 24,
        marginBottom: 16,
        elevation: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    unitIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    unitCode: {
        fontSize: 16,
        fontWeight: '900',
    },
    unitName: {
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 18,
        marginBottom: 10,
        height: 36,
    },
    unitMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unitCodeFull: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    miniDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 6,
    },
    loader: {
        marginTop: 60,
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 15,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        marginTop: 15,
        fontWeight: '600',
    },
});

export default ProgramDetailScreen;
