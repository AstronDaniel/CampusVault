import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { useTheme, Searchbar, Chip, Surface, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  FadeInRight, 
  FadeOutLeft, 
  Layout,
  SlideInRight,
  ZoomIn,
  ZoomOut
} from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const BookmarkScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;

  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter & Sort State
  const [selectedType, setSelectedType] = useState<'all' | 'notes' | 'past_paper'>('all');
  const [selectedSort, setSelectedSort] = useState<'recent' | 'alphabetical' | 'rating' | 'downloads'>('recent');

  // Load bookmarks on mount
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const response = await authService.getBookmarks();
      console.log('[BookmarkScreen] Raw bookmarks response:', response);
      
      // Handle different response structures
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.items) {
        data = response.items;
      } else if (response?.data) {
        data = response.data;
      }
      
      // Ensure each item has required properties
      const enrichedData = data.map(item => ({
        ...item,
        id: item.id || item.resource_id,
        title: item.title || 'Untitled Resource',
        resource_type: item.resource_type || 'notes',
        course_unit_name: item.course_unit?.name || item.course_unit_name || 'Unknown Course',
        average_rating: item.average_rating || item.avg_rating || 0,
        rating_count: item.rating_count || 0,
        download_count: item.download_count || item.downloads_count || 0,
        created_at: item.created_at || new Date().toISOString(),
        is_bookmarked: true, // Since this is bookmarks screen
      }));
      
      setBookmarks(enrichedData);
    } catch (error: any) {
      console.error('[BookmarkScreen] Failed to load bookmarks:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load bookmarks',
        text2: error?.message || 'Please try again',
        position: 'bottom'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Apply filters and sorting using useMemo for better performance
  const filteredBookmarks = useMemo(() => {
    let filtered = [...bookmarks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.title?.toLowerCase().includes(query) ||
        b.description?.toLowerCase().includes(query) ||
        b.course_unit_name?.toLowerCase().includes(query) ||
        b.course_unit?.code?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(b => b.resource_type === selectedType);
    }

    // Sort
    switch (selectedSort) {
      case 'alphabetical':
        filtered.sort((a, b) => a.title?.localeCompare(b.title || ''));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'downloads':
        filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        break;
      case 'recent':
      default:
        // Sort by creation date (newest first)
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return filtered;
  }, [bookmarks, searchQuery, selectedType, selectedSort]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTypeChange = (type: 'all' | 'notes' | 'past_paper') => {
    setSelectedType(type);
  };

  const handleSortChange = (sort: 'recent' | 'alphabetical' | 'rating' | 'downloads') => {
    setSelectedSort(sort);
  };

  const handleRemoveBookmark = async (id: number, title: string) => {
    try {
      await authService.unbookmarkResource(id);
      
      // Optimistic update
      setBookmarks(prev => prev.filter(b => b.id !== id));
      
      Toast.show({
        type: 'success',
        text1: 'Bookmark Removed',
        text2: `${title || 'Resource'} removed from bookmarks`,
        position: 'bottom'
      });
    } catch (error: any) {
      console.error('[BookmarkScreen] Failed to remove bookmark:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to remove bookmark',
        text2: error?.message || 'Please try again'
      });
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookmarks();
  }, []);

  const renderResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'past_paper':
        return { icon: 'file-check-outline', color: '#10B981', bgColor: '#10B98115' };
      case 'notes':
      default:
        return { icon: 'notebook-outline', color: '#6366F1', bgColor: '#6366F115' };
    }
  };

  const renderFileTypeIcon = (contentType: string) => {
    if (!contentType) return { icon: 'file-document-outline', color: '#6B7280' };
    
    const type = contentType.toLowerCase();
    if (type.includes('pdf')) return { icon: 'file-pdf-box', color: '#EF4444' };
    if (type.includes('word') || type.includes('document')) return { icon: 'file-word-box', color: '#2563EB' };
    if (type.includes('powerpoint') || type.includes('presentation')) return { icon: 'file-powerpoint-box', color: '#F59E0B' };
    if (type.includes('image')) return { icon: 'file-image-box', color: '#8B5CF6' };
    return { icon: 'file-document-outline', color: '#6B7280' };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderItem = ({ item, index }: any) => {
    const typeIcon = renderResourceTypeIcon(item.resource_type);
    const fileIcon = renderFileTypeIcon(item.content_type);
    
    return (
      <Animated.View
        entering={SlideInRight.delay(index * 50)}
        exiting={ZoomOut}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          style={[styles.bookmarkCard, { 
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            shadowColor: isDark ? '#000' : '#000',
          }]}
          onPress={() => navigation.navigate('ResourceDetails', { id: item.id })}
          activeOpacity={0.8}
        >
          {/* Left Icon Section */}
          <View style={styles.cardLeft}>
            <View style={[styles.typeIconContainer, { backgroundColor: typeIcon.bgColor }]}>
              <Icon name={typeIcon.icon} size={24} color={typeIcon.color} />
            </View>
            <View style={[styles.fileIconContainer, { 
              backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6',
              borderColor: isDark ? '#1E1E1E' : '#FFFFFF'
            }]}>
              <Icon name={fileIcon.icon} size={16} color={fileIcon.color} />
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]} numberOfLines={2}>
              {item.title}
            </Text>
            
            <View style={styles.courseInfo}>
              <Icon name="book-open-page-variant" size={12} color={isDark ? '#9CA3AF' : theme.colors.outline} />
              <Text style={[styles.courseText, { color: isDark ? '#9CA3AF' : theme.colors.outline }]} numberOfLines={1}>
                {item.course_unit_name}
              </Text>
            </View>

            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <Icon name="star" size={12} color="#FBBF24" />
                <Text style={[styles.metaText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {item.average_rating?.toFixed(1) || '0.0'}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Icon name="download" size={12} color={isDark ? '#9CA3AF' : theme.colors.outline} />
                <Text style={[styles.metaText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {item.download_count || 0}
                </Text>
              </View>
              
              <View style={styles.metaItem}>
                <Icon name="clock-outline" size={12} color={isDark ? '#9CA3AF' : theme.colors.outline} />
                <Text style={[styles.metaText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                  {formatDate(item.created_at)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={() => handleRemoveBookmark(item.id, item.title)}
            style={[styles.actionBtn, { 
              backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6',
            }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="bookmark" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View 
      entering={ZoomIn.delay(200)}
      style={styles.emptyContainer}
    >
      <Surface style={[
        styles.emptySurface, 
        { 
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          elevation: isDark ? 0 : 2
        }
      ]}>
        <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
          <Icon name="bookmark-outline" size={48} color={theme.colors.primary} />
        </View>
        
        <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {searchQuery ? 'No bookmarks found' : 'No bookmarks yet'}
        </Text>
        
        <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
          {searchQuery 
            ? 'Try adjusting your search or filters'
            : 'Bookmark resources to access them quickly later'
          }
        </Text>

        {!searchQuery && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Explore')}
            style={styles.exploreButton}
            contentStyle={{ height: 48 }}
            icon="compass"
          >
            Explore Resources
          </Button>
        )}
      </Surface>
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View entering={FadeInRight.delay(100)}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Icon name="bookmark-multiple" size={28} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Bookmarks
            </Text>
            <Text style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : theme.colors.outline }]}>
              {bookmarks.length} saved {bookmarks.length === 1 ? 'resource' : 'resources'}
            </Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <Searchbar
          placeholder="Search bookmarks..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={[
            styles.searchBar, 
            { 
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#2A2A2A' : '#E5E7EB'
            }
          ]}
          inputStyle={{ color: isDark ? '#FFFFFF' : '#000000' }}
          iconColor={isDark ? '#9CA3AF' : theme.colors.outline}
          placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
          clearIcon={searchQuery ? 'close-circle' : undefined}
          onClearIconPress={() => setSearchQuery('')}
        />
      </View>

      {/* Filters */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterScroll}
        >
          {/* Type Filters */}
          <Chip
            selected={selectedType === 'all'}
            onPress={() => handleTypeChange('all')}
            style={[
              styles.chip,
              selectedType === 'all' && { 
                backgroundColor: isDark ? theme.colors.primary : theme.colors.primary,
                borderColor: theme.colors.primary
              }
            ]}
            textStyle={[
              styles.chipText,
              selectedType === 'all' && { color: '#FFFFFF' },
              { color: isDark ? '#FFFFFF' : theme.colors.primary }
            ]}
            showSelectedCheck={false}
            compact
            mode={isDark && selectedType !== 'all' ? 'outlined' : 'flat'}
          >
            All
          </Chip>
          
          <Chip
            selected={selectedType === 'notes'}
            onPress={() => handleTypeChange('notes')}
            style={[
              styles.chip,
              selectedType === 'notes' && { 
                backgroundColor: isDark ? '#6366F1' : '#6366F1',
                borderColor: '#6366F1'
              }
            ]}
            textStyle={[
              styles.chipText,
              selectedType === 'notes' && { color: '#FFFFFF' },
              { color: isDark ? '#FFFFFF' : '#6366F1' }
            ]}
            showSelectedCheck={false}
            icon="notebook-outline"
            compact
            mode={isDark && selectedType !== 'notes' ? 'outlined' : 'flat'}
          >
            Notes
          </Chip>
          
          <Chip
            selected={selectedType === 'past_paper'}
            onPress={() => handleTypeChange('past_paper')}
            style={[
              styles.chip,
              selectedType === 'past_paper' && { 
                backgroundColor: isDark ? '#10B981' : '#10B981',
                borderColor: '#10B981'
              }
            ]}
            textStyle={[
              styles.chipText,
              selectedType === 'past_paper' && { color: '#FFFFFF' },
              { color: isDark ? '#FFFFFF' : '#10B981' }
            ]}
            showSelectedCheck={false}
            icon="file-check-outline"
            compact
            mode={isDark && selectedType !== 'past_paper' ? 'outlined' : 'flat'}
          >
            Past Papers
          </Chip>

          <View style={[styles.filterDivider, { 
            backgroundColor: isDark ? '#2A2A2A' : 'rgba(0,0,0,0.1)' 
          }]} />

          {/* Sort Filters */}
          <Chip
            selected={selectedSort === 'recent'}
            onPress={() => handleSortChange('recent')}
            style={[
              styles.sortChip,
              selectedSort === 'recent' && { 
                borderColor: theme.colors.primary,
                backgroundColor: isDark ? theme.colors.primary + '20' : 'transparent'
              }
            ]}
            mode="outlined"
            compact
            textStyle={{ 
              color: isDark ? (selectedSort === 'recent' ? theme.colors.primary : '#9CA3AF') : undefined 
            }}
          >
            Recent
          </Chip>
          
          <Chip
            selected={selectedSort === 'alphabetical'}
            onPress={() => handleSortChange('alphabetical')}
            style={[
              styles.sortChip,
              selectedSort === 'alphabetical' && { 
                borderColor: theme.colors.primary,
                backgroundColor: isDark ? theme.colors.primary + '20' : 'transparent'
              }
            ]}
            mode="outlined"
            compact
            textStyle={{ 
              color: isDark ? (selectedSort === 'alphabetical' ? theme.colors.primary : '#9CA3AF') : undefined 
            }}
          >
            A-Z
          </Chip>
          
          <Chip
            selected={selectedSort === 'rating'}
            onPress={() => handleSortChange('rating')}
            style={[
              styles.sortChip,
              selectedSort === 'rating' && { 
                borderColor: theme.colors.primary,
                backgroundColor: isDark ? theme.colors.primary + '20' : 'transparent'
              }
            ]}
            mode="outlined"
            compact
            textStyle={{ 
              color: isDark ? (selectedSort === 'rating' ? theme.colors.primary : '#9CA3AF') : undefined 
            }}
          >
            Top Rated
          </Chip>
          
          <Chip
            selected={selectedSort === 'downloads'}
            onPress={() => handleSortChange('downloads')}
            style={[
              styles.sortChip,
              selectedSort === 'downloads' && { 
                borderColor: theme.colors.primary,
                backgroundColor: isDark ? theme.colors.primary + '20' : 'transparent'
              }
            ]}
            mode="outlined"
            compact
            textStyle={{ 
              color: isDark ? (selectedSort === 'downloads' ? theme.colors.primary : '#9CA3AF') : undefined 
            }}
          >
            Most Downloaded
          </Chip>
        </ScrollView>
      </View>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: isDark ? '#9CA3AF' : theme.colors.outline }]}>
          Loading bookmarks...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
      <FlatList
        data={filteredBookmarks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={isDark ? '#1E1E1E' : '#FFFFFF'}
          />
        }
        ItemSeparatorComponent={() => <View style={[styles.separator, { 
          backgroundColor: isDark ? 'transparent' : 'transparent' 
        }]} />}
        // Performance optimizations
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={5}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        getItemLayout={(data, index) => ({
          length: 140, // Approximate item height
          offset: 140 * index,
          index,
        })}
      />
      
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  separator: {
    height: 12,
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  
  // Search Styles
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBar: {
    borderRadius: 16,
    elevation: 0,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  
  // Filter Styles
  filterSection: {
    marginBottom: 20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 4,
  },
  chip: {
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortChip: {
    borderRadius: 12,
    height: 36,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  
  // Bookmark Card Styles
  bookmarkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    position: 'relative',
    marginRight: 16,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileIconContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 6,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    flex: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  emptySurface: {
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    minHeight: 300,
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 280,
  },
  exploreButton: {
    borderRadius: 14,
    minWidth: 200,
  },
});

export default BookmarkScreen;