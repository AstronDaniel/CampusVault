import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  StatusBar,
  Animated,
  RefreshControl,
  Image
} from 'react-native';
import { 
  Text, 
  Card, 
  useTheme, 
  Surface, 
  Button,
  Chip,
  Avatar,
  TouchableRipple,
  Searchbar,
  FAB
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface ModernHomeScreenProps {
  onLogout?: () => void;
}

const ModernHomeScreen: React.FC<ModernHomeScreenProps> = ({ onLogout }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const styles = createStyles(theme);

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const categories = [
    { id: 'all', label: 'All', icon: 'apps', count: 24 },
    { id: 'notes', label: 'Notes', icon: 'note', count: 8 },
    { id: 'assignments', label: 'Assignments', icon: 'assignment', count: 5 },
    { id: 'resources', label: 'Resources', icon: 'folder', count: 11 },
  ];

  const recentItems = [
    {
      id: 1,
      title: 'Advanced Mathematics Notes',
      subtitle: 'Chapter 5: Calculus Integration',
      type: 'notes',
      date: '2 hours ago',
      progress: 85,
      color: theme.colors.primary,
    },
    {
      id: 2,
      title: 'Physics Lab Report',
      subtitle: 'Quantum Mechanics Experiment',
      type: 'assignment',
      date: 'Due tomorrow',
      progress: 60,
      color: theme.colors.secondary,
    },
    {
      id: 3,
      title: 'Computer Science Resources',
      subtitle: 'Data Structures & Algorithms',
      type: 'resources',
      date: '1 day ago',
      progress: 100,
      color: theme.colors.tertiary,
    },
  ];

  const quickActions = [
    { id: 1, title: 'Upload Document', icon: 'cloud-upload', color: theme.colors.primary },
    { id: 2, title: 'Create Note', icon: 'note-add', color: theme.colors.secondary },
    { id: 3, title: 'Join Study Group', icon: 'group-add', color: theme.colors.tertiary },
    { id: 4, title: 'Schedule', icon: 'event', color: '#FF6B6B' },
  ];

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.userSection}>
            <Avatar.Image
              size={50}
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text variant="headlineSmall" style={styles.welcomeText}>
                Welcome back, John! 👋
              </Text>
              <Text variant="bodyMedium" style={styles.userSubtext}>
                Ready to continue learning?
              </Text>
            </View>
          </View>

          <TouchableRipple
            onPress={onLogout}
            style={styles.notificationButton}
            borderless
          >
            <Icon name="notifications" size={24} color="#FFFFFF" />
          </TouchableRipple>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Surface style={styles.statCard} elevation={4}>
            <Text variant="headlineMedium" style={styles.statNumber}>24</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Total Items</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={4}>
            <Text variant="headlineMedium" style={styles.statNumber}>5</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Pending</Text>
          </Surface>
          <Surface style={styles.statCard} elevation={4}>
            <Text variant="headlineMedium" style={styles.statNumber}>89%</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Progress</Text>
          </Surface>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderSearchAndCategories = () => (
    <Animated.View
      style={[
        styles.searchSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Searchbar
        placeholder="Search your resources..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        icon={() => <Icon name="search" size={20} color={theme.colors.onSurfaceVariant} />}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <Chip
            key={category.id}
            selected={selectedCategory === category.id}
            onPress={() => setSelectedCategory(category.id)}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.selectedCategoryChip,
            ]}
            textStyle={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.selectedCategoryChipText,
            ]}
            icon={() => (
              <Icon
                name={category.icon}
                size={16}
                color={
                  selectedCategory === category.id
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant
                }
              />
            )}
          >
            {category.label} ({category.count})
          </Chip>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <Animated.View
      style={[
        styles.quickActionsSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text variant="titleLarge" style={styles.sectionTitle}>
        Quick Actions
      </Text>
      <View style={styles.quickActionsGrid}>
        {quickActions.map((action) => (
          <TouchableRipple
            key={action.id}
            onPress={() => console.log(`Action: ${action.title}`)}
            style={styles.quickActionItem}
          >
            <Surface style={styles.quickActionSurface} elevation={3}>
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}20` }]}>
                <Icon name={action.icon} size={24} color={action.color} />
              </View>
              <Text variant="bodyMedium" style={styles.quickActionText}>
                {action.title}
              </Text>
            </Surface>
          </TouchableRipple>
        ))}
      </View>
    </Animated.View>
  );

  const renderRecentItems = () => (
    <Animated.View
      style={[
        styles.recentSection,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Recent Activity
        </Text>
        <Button mode="text" onPress={() => console.log('View all')}>
          View All
        </Button>
      </View>

      {recentItems.map((item) => (
        <Card key={item.id} style={styles.recentItemCard}>
          <TouchableRipple onPress={() => console.log(`Open: ${item.title}`)}>
            <View style={styles.recentItemContent}>
              <View style={[styles.recentItemIcon, { backgroundColor: `${item.color}20` }]}>
                <Icon
                  name={
                    item.type === 'notes' ? 'note' :
                    item.type === 'assignment' ? 'assignment' : 'folder'
                  }
                  size={24}
                  color={item.color}
                />
              </View>
              
              <View style={styles.recentItemInfo}>
                <Text variant="titleMedium" style={styles.recentItemTitle}>
                  {item.title}
                </Text>
                <Text variant="bodyMedium" style={styles.recentItemSubtitle}>
                  {item.subtitle}
                </Text>
                <Text variant="bodySmall" style={styles.recentItemDate}>
                  {item.date}
                </Text>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${item.progress}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                  <Text variant="bodySmall" style={styles.progressText}>
                    {item.progress}%
                  </Text>
                </View>
              </View>

              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </View>
          </TouchableRipple>
        </Card>
      ))}
    </Animated.View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderHeader()}
          {renderSearchAndCategories()}
          {renderQuickActions()}
          {renderRecentItems()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <FAB
          icon="add"
          style={styles.fab}
          onPress={() => console.log('FAB pressed')}
        />
      </SafeAreaView>
    </>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flex: 1,
    },
    headerContainer: {
      marginBottom: 24,
    },
    headerGradient: {
      paddingTop: 20,
      paddingBottom: 32,
      paddingHorizontal: 24,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      marginRight: 16,
    },
    userInfo: {
      flex: 1,
    },
    welcomeText: {
      color: '#FFFFFF',
      fontWeight: '700',
      marginBottom: 4,
    },
    userSubtext: {
      color: '#FFFFFF',
      opacity: 0.9,
    },
    notificationButton: {
      padding: 8,
      borderRadius: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statCard: {
      flex: 1,
      marginHorizontal: 4,
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
    },
    statNumber: {
      color: theme.colors.primary,
      fontWeight: '800',
      marginBottom: 4,
    },
    statLabel: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    searchSection: {
      paddingHorizontal: 24,
      marginBottom: 24,
    },
    searchBar: {
      marginBottom: 16,
      elevation: 2,
    },
    searchInput: {
      fontSize: 16,
    },
    categoriesContainer: {
      marginBottom: 8,
    },
    categoriesContent: {
      paddingRight: 24,
    },
    categoryChip: {
      marginRight: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    selectedCategoryChip: {
      backgroundColor: theme.colors.primary,
    },
    categoryChipText: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    selectedCategoryChipText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
    quickActionsSection: {
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '700',
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickActionItem: {
      width: '48%',
      marginBottom: 12,
      borderRadius: 16,
    },
    quickActionSurface: {
      padding: 20,
      borderRadius: 16,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    quickActionText: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      textAlign: 'center',
    },
    recentSection: {
      paddingHorizontal: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    recentItemCard: {
      marginBottom: 12,
      borderRadius: 16,
      elevation: 2,
    },
    recentItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    recentItemIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    recentItemInfo: {
      flex: 1,
    },
    recentItemTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: 4,
    },
    recentItemSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    recentItemDate: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      marginBottom: 8,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressBar: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 2,
      marginRight: 8,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressText: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      minWidth: 35,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary,
    },
    bottomSpacing: {
      height: 100,
    },
  });

export default ModernHomeScreen;