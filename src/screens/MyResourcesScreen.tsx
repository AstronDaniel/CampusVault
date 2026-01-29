import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { useTheme, Surface, Button, Chip, Menu } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { 
  FadeInUp, 
  SlideInRight, 
  ZoomIn, 
  Layout,
  SlideOutLeft 
} from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const MyResourcesScreen = ({ navigation }: any) => {
  const theme = useTheme();
  const isDark = theme.dark;

  const [resources, setResources] = useState<any[]>([]);
  const [filteredResources, setFilteredResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'notes' | 'past_paper'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    notes: 0,
    past_papers: 0,
    totalDownloads: 0,
    avgRating: 0,
  });

  useEffect(() => {
    loadResources();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [resources, selectedType, sortBy]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await authService.getMyResources();
      
      console.log('[MyResources] Response:', response);
      
      let data: any[] = [];
      if (Array.isArray(response)) {
        data = response;
      } else if (response?.items) {
        data = response.items;
      } else if (response?.data) {
        data = response.data;
      }
      
      // Process and enrich resource data
      const processedData = data.map(item => ({
        ...item,
        id: item.id,
        title: item.title || 'Untitled Resource',
        description: item.description || '',
        resource_type: item.resource_type || 'notes',
        course_unit_name: item.course_unit?.name || item.course_unit_name || 'Unknown Course',
        download_count: item.download_count || item.downloads_count || 0,
        average_rating: item.average_rating || item.avg_rating || 0,
        rating_count: item.rating_count || 0,
        created_at: item.created_at || new Date().toISOString(),
        is_owner: true, // Since this is "My Resources"
      }));
      
      setResources(processedData);
      
      // Calculate stats
      calculateStats(processedData);
      
    } catch (error: any) {
      console.error('[MyResources] Failed to load resources:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load resources',
        text2: error?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const total = data.length;
    const notes = data.filter(r => r.resource_type === 'notes').length;
    const past_papers = data.filter(r => r.resource_type === 'past_paper').length;
    const totalDownloads = data.reduce((sum, r) => sum + (r.download_count || 0), 0);
    const avgRating = total > 0 
      ? parseFloat((data.reduce((sum, r) => sum + (r.average_rating || 0), 0) / total).toFixed(1))
      : 0;
    
    setStats({ total, notes, past_papers, totalDownloads, avgRating });
  };

  const applyFilters = () => {
    let filtered = [...resources];
    
    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(r => r.resource_type === selectedType);
    }
    
    // Sort
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.download_count || 0) - (a.download_count || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
        break;
    }
    
    setFilteredResources(filtered);
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadResources();
  }, []);

  const handleDeleteResource = async (id: number, title: string) => {
    Alert.alert(
      'Delete Resource',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteResource?.(id);
              
              // Optimistic update
              setResources(prev => prev.filter(r => r.id !== id));
              
              Toast.show({
                type: 'success',
                text1: 'Resource Deleted',
                text2: 'The resource has been removed successfully',
              });
            } catch (error: any) {
              console.error('[MyResources] Delete failed:', error);
              Toast.show({
                type: 'error',
                text1: 'Delete Failed',
                text2: error?.message || 'Please try again',
              });
            }
          },
        },
      ]
    );
  };

  const handleEditResource = (resource: any) => {
    navigation.navigate('EditResource', { resource });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently';
    
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderStatsCard = (icon: string, value: string | number, label: string, color: string) => (
    <Animated.View entering={ZoomIn.delay(200)}>
      <Surface style={[styles.statCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.outline }]}>{label}</Text>
      </Surface>
    </Animated.View>
  );

  const renderResourceItem = ({ item, index }: any) => (
    <Animated.View
      entering={SlideInRight.delay(index * 50)}
      exiting={SlideOutLeft}
      layout={Layout.springify()}
    >
      <Surface style={[styles.resourceCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        {/* Left Icon Section */}
        <View style={styles.cardLeft}>
          <View style={[
            styles.resourceTypeIcon,
            { backgroundColor: item.resource_type === 'notes' ? '#6366F115' : '#10B98115' }
          ]}>
            <Icon
              name={item.resource_type === 'notes' ? 'notebook-outline' : 'file-check-outline'}
              size={24}
              color={item.resource_type === 'notes' ? '#6366F1' : '#10B981'}
            />
          </View>
        </View>

        {/* Content Section */}
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('ResourceDetails', { id: item.id })}
          activeOpacity={0.8}
        >
          <Text style={[styles.resourceTitle, { color: isDark ? '#FFFFFF' : '#111827' }]} numberOfLines={2}>
            {item.title}
          </Text>
          
          <View style={styles.courseInfo}>
            <Icon name="book-open-page-variant" size={12} color={theme.colors.outline} />
            <Text style={[styles.courseText, { color: theme.colors.outline }]} numberOfLines={1}>
              {item.course_unit_name}
            </Text>
          </View>

          <View style={styles.resourceMeta}>
            <View style={styles.metaItem}>
              <Icon name="download" size={12} color={theme.colors.outline} />
              <Text style={[styles.metaText, { color: theme.colors.outline }]}>
                {item.download_count || 0}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Icon name="star" size={12} color="#FBBF24" />
              <Text style={[styles.metaText, { color: theme.colors.outline }]}>
                {item.average_rating?.toFixed(1) || '0.0'}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Icon name="clock-outline" size={12} color={theme.colors.outline} />
              <Text style={[styles.metaText, { color: theme.colors.outline }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Menu */}
        <View style={styles.actionMenu}>
          <Menu
            visible={false} // Controlled by touchable
            onDismiss={() => {}}
            anchor={
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  // Handle menu press
                }}
              >
                <Icon name="dots-vertical" size={20} color={theme.colors.outline} />
              </TouchableOpacity>
            }
            contentStyle={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderRadius: 12,
            }}
          >
            <Menu.Item
              onPress={() => handleEditResource(item)}
              title="Edit"
              leadingIcon="pencil"
              titleStyle={{ color: isDark ? '#FFFFFF' : '#111827' }}
            />
            <Menu.Item
              onPress={() => handleDeleteResource(item.id, item.title)}
              title="Delete"
              leadingIcon="delete"
              titleStyle={{ color: '#EF4444' }}
            />
          </Menu>
        </View>
      </Surface>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View entering={ZoomIn.delay(300)} style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
        <Icon name="folder-upload-outline" size={48} color={theme.colors.primary} />
      </View>
      
      <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
        No Resources Yet
      </Text>
      
      <Text style={[styles.emptySubtitle, { color: theme.colors.outline }]}>
        Share your first resource to help others learn
      </Text>

      <Button
        mode="contained"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Upload' })}
        style={styles.uploadButton}
        contentStyle={{ height: 48 }}
        icon="cloud-upload"
      >
        Upload Your First Resource
      </Button>
    </Animated.View>
  );

  const renderHeader = () => (
    <Animated.View entering={FadeInUp.delay(100)} style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#111827'} />
      </TouchableOpacity>
      <View style={styles.headerTitle}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          My Resources
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.outline }]}>
          Manage your uploaded materials
        </Text>
      </View>
    </Animated.View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.outline }]}>
          Loading your resources...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0A0A0A' : '#F8FAFC' }]}>
      {renderHeader()}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={isDark ? '#1E1E1E' : '#FFFFFF'}
          />
        }
      >
        {/* Stats Overview */}
        {resources.length > 0 && (
          <Animated.View entering={FadeInUp.delay(150)}>
            <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>
              YOUR UPLOAD STATS
            </Text>
            <View style={styles.statsGrid}>
              {renderStatsCard('file-document-multiple', stats.total, 'Total', '#6366F1')}
              {renderStatsCard('notebook', stats.notes, 'Notes', '#10B981')}
              {renderStatsCard('file-check', stats.past_papers, 'Past Papers', '#F59E0B')}
              {renderStatsCard('download', stats.totalDownloads, 'Downloads', '#8B5CF6')}
            </View>
          </Animated.View>
        )}

        {/* Filters */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <View style={styles.filterSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>
              FILTERS
            </Text>
            
            <View style={styles.filtersRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeFilters}>
                <TouchableOpacity
                  style={[
                    styles.typeChip,
                    selectedType === 'all' && { backgroundColor: theme.colors.primary },
                    { borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }
                  ]}
                  onPress={() => setSelectedType('all')}
                >
                  <Text style={[
                    styles.typeChipText,
                    selectedType === 'all' && { color: '#FFFFFF' },
                    { color: isDark ? '#FFFFFF' : '#111827' }
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeChip,
                    selectedType === 'notes' && { backgroundColor: '#6366F1' },
                    { borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }
                  ]}
                  onPress={() => setSelectedType('notes')}
                >
                  <Icon 
                    name="notebook-outline" 
                    size={16} 
                    color={selectedType === 'notes' ? '#FFFFFF' : '#6366F1'} 
                    style={styles.typeChipIcon}
                  />
                  <Text style={[
                    styles.typeChipText,
                    selectedType === 'notes' && { color: '#FFFFFF' },
                    { color: '#6366F1' }
                  ]}>
                    Notes
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeChip,
                    selectedType === 'past_paper' && { backgroundColor: '#10B981' },
                    { borderColor: isDark ? '#2A2A2A' : '#E5E7EB' }
                  ]}
                  onPress={() => setSelectedType('past_paper')}
                >
                  <Icon 
                    name="file-check-outline" 
                    size={16} 
                    color={selectedType === 'past_paper' ? '#FFFFFF' : '#10B981'} 
                    style={styles.typeChipIcon}
                  />
                  <Text style={[
                    styles.typeChipText,
                    selectedType === 'past_paper' && { color: '#FFFFFF' },
                    { color: '#10B981' }
                  ]}>
                    Past Papers
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            
            {/* Sort Chips */}
            <View style={styles.sortSection}>
              <Text style={[styles.sortLabel, { color: theme.colors.outline }]}>
                SORT BY
              </Text>
              <View style={styles.sortContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortBy === 'recent' && { backgroundColor: theme.colors.primary },
                    { borderColor: isDark ? '#374151' : '#E5E7EB' }
                  ]}
                  onPress={() => setSortBy('recent')}
                >
                  <Icon 
                    name="clock-outline" 
                    size={16} 
                    color={sortBy === 'recent' ? '#FFFFFF' : theme.colors.outline} 
                  />
                  <Text style={[
                    styles.sortChipText,
                    sortBy === 'recent' ? { color: '#FFFFFF' } : { color: theme.colors.outline }
                  ]}>
                    Recent
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortBy === 'popular' && { backgroundColor: theme.colors.primary },
                    { borderColor: isDark ? '#374151' : '#E5E7EB' }
                  ]}
                  onPress={() => setSortBy('popular')}
                >
                  <Icon 
                    name="download" 
                    size={16} 
                    color={sortBy === 'popular' ? '#FFFFFF' : theme.colors.outline} 
                  />
                  <Text style={[
                    styles.sortChipText,
                    sortBy === 'popular' ? { color: '#FFFFFF' } : { color: theme.colors.outline }
                  ]}>
                    Popular
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortChip,
                    sortBy === 'rating' && { backgroundColor: theme.colors.primary },
                    { borderColor: isDark ? '#374151' : '#E5E7EB' }
                  ]}
                  onPress={() => setSortBy('rating')}
                >
                  <Icon 
                    name="star" 
                    size={16} 
                    color={sortBy === 'rating' ? '#FFFFFF' : theme.colors.outline} 
                  />
                  <Text style={[
                    styles.sortChipText,
                    sortBy === 'rating' ? { color: '#FFFFFF' } : { color: theme.colors.outline }
                  ]}>
                    Rating
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Resources List */}
        <Animated.View entering={FadeInUp.delay(250)}>
          <View style={styles.resourcesHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.outline }]}>
              YOUR UPLOADS ({filteredResources.length})
            </Text>
          </View>
          
          {filteredResources.length > 0 ? (
            <FlatList
              data={filteredResources}
              renderItem={renderResourceItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            renderEmptyState()
          )}
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Upload FAB */}
      {resources.length > 0 && (
        <Animated.View entering={ZoomIn.delay(400)} style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Upload' })}
            activeOpacity={0.9}
          >
            <Icon name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      )}

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 56) / 4,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterSection: {
    marginBottom: 24,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeFilters: {
    flex: 1,
    marginRight: 12,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeChipIcon: {
    marginRight: 6,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
  },
  sortText: {
    fontSize: 13,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  sortSection: {
    marginTop: 16,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resourcesHeader: {
    marginBottom: 16,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardLeft: {
    marginRight: 16,
  },
  resourceTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  resourceTitle: {
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
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  resourceMeta: {
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
    fontWeight: '600',
  },
  actionMenu: {
    marginLeft: 12,
  },
  menuButton: {
    padding: 8,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
    marginBottom: 32,
    lineHeight: 20,
    maxWidth: 280,
  },
  uploadButton: {
    borderRadius: 16,
    minWidth: 200,
  },
  bottomSpacing: {
    height: 40,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 30,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});

export default MyResourcesScreen;