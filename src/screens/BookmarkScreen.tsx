import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useTheme, Searchbar, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInRight, FadeOutLeft, Layout } from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const BookmarkScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [filteredBookmarks, setFilteredBookmarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter & Sort State
    const [selectedType, setSelectedType] = useState('all');
    const [selectedSort, setSelectedSort] = useState('recent');

    useEffect(() => {
        loadBookmarks();
    }, []);

    const loadBookmarks = async () => {
        setLoading(true);
        try {
            const response = await authService.getBookmarks();
            const data = Array.isArray(response) ? response : (response?.items || []);
            setBookmarks(data);
            applyFilters(data, searchQuery, selectedType, selectedSort);
        } catch (error) {
            console.error('Failed to load bookmarks:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const applyFilters = (data: any[], query: string, type: string, sort: string) => {
        let filtered = [...data];

        // Search filter
        if (query) {
            filtered = filtered.filter(b =>
                b.title.toLowerCase().includes(query.toLowerCase()) ||
                (b.course_unit_name && b.course_unit_name.toLowerCase().includes(query.toLowerCase()))
            );
        }

        // Type filter
        if (type !== 'all') {
            filtered = filtered.filter(b => b.resource_type === type);
        }

        // Sort
        if (sort === 'alphabetical') {
            filtered.sort((a, b) => a.title.localeCompare(b.title));
        } else if (sort === 'rating') {
            filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        } else {
            // default to recent (assuming id or created_at)
            filtered.sort((a, b) => b.id - a.id);
        }

        setFilteredBookmarks(filtered);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        applyFilters(bookmarks, query, selectedType, selectedSort);
    };

    const handleTypeChange = (type: string) => {
        setSelectedType(type);
        applyFilters(bookmarks, searchQuery, type, selectedSort);
    };

    const handleSortChange = (sort: string) => {
        setSelectedSort(sort);
        applyFilters(bookmarks, searchQuery, selectedType, sort);
    };

    const handleRemoveBookmark = async (id: number) => {
        try {
            await authService.unbookmarkResource(id);
            const newList = bookmarks.filter(b => b.id !== id);
            setBookmarks(newList);
            applyFilters(newList, searchQuery, selectedType, selectedSort);
            Toast.show({
                type: 'success',
                text1: 'Bookmark Removed',
                position: 'bottom'
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Failed to remove bookmark'
            });
        }
    };

    const renderItem = ({ item, index }: any) => (
        <Animated.View
            entering={FadeInRight.delay(index * 100)}
            exiting={FadeOutLeft}
            layout={Layout.springify()}
        >
            <TouchableOpacity
                style={[styles.bookmarkCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}
                onPress={() => navigation.navigate('ResourceDetails', { resourceId: item.id })}
                activeOpacity={0.7}
            >
                <View style={[styles.fileIcon, { backgroundColor: item.resource_type === 'notes' ? '#6366F1' + '15' : '#10B981' + '15' }]}>
                    <Icon
                        name={item.resource_type === 'notes' ? "file-document-outline" : "file-check-outline"}
                        size={28}
                        color={item.resource_type === 'notes' ? "#6366F1" : "#10B981"}
                    />
                </View>

                <View style={styles.content}>
                    <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.outline }]} numberOfLines={1}>
                        {item.course_unit_name || 'General Resource'}
                    </Text>
                    <View style={styles.meta}>
                        <View style={styles.rating}>
                            <Icon name="star" size={12} color="#FBBF24" />
                            <Text style={[styles.metaText, { color: theme.colors.outline }]}> {item.avg_rating || '0.0'}</Text>
                        </View>
                        <Text style={[styles.metaText, { color: theme.colors.outline }]}> • {item.downloads_count || 0} Downloads</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => handleRemoveBookmark(item.id)}
                    style={styles.actionBtn}
                >
                    <Icon name="bookmark" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Saved Resources</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.outline }]}>
                    {bookmarks.length} materials saved for offline study
                </Text>
            </View>

            {/* SEARCH */}
            <View style={styles.searchSection}>
                <Searchbar
                    placeholder="Search your bookmarks..."
                    onChangeText={handleSearch}
                    value={searchQuery}
                    style={[styles.searchBar, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}
                    inputStyle={{ color: isDark ? '#fff' : '#000' }}
                    iconColor={isDark ? 'rgba(255,255,255,0.5)' : theme.colors.outline}
                />
            </View>

            {/* FILTERS */}
            <View style={styles.filterSection}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <Chip
                        selected={selectedType === 'all'}
                        onPress={() => handleTypeChange('all')}
                        style={styles.chip}
                        showSelectedCheck={false}
                    >All</Chip>
                    <Chip
                        selected={selectedType === 'notes'}
                        onPress={() => handleTypeChange('notes')}
                        style={styles.chip}
                        showSelectedCheck={false}
                        icon="notebook-outline"
                    >Notes</Chip>
                    <Chip
                        selected={selectedType === 'past_paper'}
                        onPress={() => handleTypeChange('past_paper')}
                        style={styles.chip}
                        showSelectedCheck={false}
                        icon="file-check-outline"
                    >Past Papers</Chip>

                    <View style={styles.divider} />

                    <Chip
                        selected={selectedSort === 'recent'}
                        onPress={() => handleSortChange('recent')}
                        style={styles.chip}
                        mode="outlined"
                    >Recent</Chip>
                    <Chip
                        selected={selectedSort === 'alphabetical'}
                        onPress={() => handleSortChange('alphabetical')}
                        style={styles.chip}
                        mode="outlined"
                    >A-Z</Chip>
                    <Chip
                        selected={selectedSort === 'rating'}
                        onPress={() => handleSortChange('rating')}
                        style={styles.chip}
                        mode="outlined"
                    >Top Rated</Chip>
                </ScrollView>
            </View>

            {/* LIST */}
            {loading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredBookmarks}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBookmarks(); }} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="bookmark-outline" size={80} color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                            <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
                                {searchQuery ? 'No bookmarks match your search' : "You haven't saved any resources yet"}
                            </Text>
                            {!searchQuery && (
                                <TouchableOpacity
                                    style={[styles.exploreBtn, { backgroundColor: theme.colors.primary }]}
                                    onPress={() => navigation.navigate('Explore')}
                                >
                                    <Text style={styles.exploreBtnText}>Go Explore</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                />
            )}

            <Toast />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    searchSection: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchBar: {
        borderRadius: 15,
        elevation: 0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    filterSection: {
        marginBottom: 16,
    },
    filterScroll: {
        paddingHorizontal: 20,
        gap: 8,
    },
    chip: {
        borderRadius: 12,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginHorizontal: 8,
        alignSelf: 'center',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    bookmarkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 20,
        marginBottom: 12,
        elevation: 1,
    },
    fileIcon: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 16,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rating: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 11,
        fontWeight: '700',
    },
    actionBtn: {
        padding: 10,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
        maxWidth: 250,
    },
    exploreBtn: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    exploreBtnText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 14,
    },
});

export default BookmarkScreen;
