import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { authService } from '../services/authService';

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  file_type: string;
  file_url: string;
  file_size?: string;
  resource_type?: string;
  download_count?: number;
  average_rating?: number;
  user_rating?: number;
  is_bookmarked: boolean;
  course_unit?: {
    code: string;
  };
}

interface RouteParams {
  resource: Resource;
}

const ResourceDetailsScreen = ({ route, navigation }: any) => {
  const { resource } = route.params as RouteParams;
  const theme = useTheme();
  const isDark = theme.dark;

  const [details, setDetails] = useState<Resource>(resource);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(resource.is_bookmarked);
  const [userRating, setUserRating] = useState(resource.user_rating || 0);

  useEffect(() => {
    fetchResourceDetails();
  }, []);

  const fetchResourceDetails = async () => {
    try {
      setLoading(true);
      // Fetch resource details and comments separately
      const resourceData = await authService.getResourceById(Number(details.id));
      const commentsData = await authService.getComments(Number(details.id));
      if (resourceData) {
        setDetails(resourceData);
      }
      if (commentsData) {
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching resource details:', error);
      Alert.alert('Error', 'Failed to load resource details');
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      if (newBookmarkState) {
        await authService.bookmarkResource(Number(details.id));
      } else {
        await authService.unbookmarkResource(Number(details.id));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      setIsBookmarked(!isBookmarked); // Revert on error
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const handleRate = async (rating: number) => {
    try {
      setUserRating(rating);
      await authService.rateResource(Number(details.id), rating);
      
      // Update average rating optimistically
      const newAverage = details.average_rating 
        ? ((details.average_rating * (details.download_count || 1) + rating) / ((details.download_count || 1) + 1))
        : rating;
      
      setDetails({ ...details, average_rating: newAverage, user_rating: rating });
    } catch (error) {
      console.error('Error rating resource:', error);
      Alert.alert('Error', 'Failed to submit rating');
    }
  };

  const handleDownload = async () => {
    try {
      if (!details.file_url) {
        Alert.alert('Error', 'Download URL not available');
        return;
      }

      const supported = await Linking.canOpenURL(details.file_url);
      if (supported) {
        await Linking.openURL(details.file_url);
        // Update download count
        setDetails({ ...details, download_count: (details.download_count || 0) + 1 });
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const newCommentObj = await authService.addComment(Number(details.id), newComment.trim());
      if (newCommentObj) {
        setComments([newCommentObj, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType?.toLowerCase() || '';
    if (type.includes('pdf')) return { name: 'file-pdf-box', color: '#EF4444' };
    if (type.includes('doc')) return { name: 'file-word-box', color: '#2563EB' };
    if (type.includes('xls') || type.includes('csv')) return { name: 'file-excel-box', color: '#10B981' };
    if (type.includes('ppt')) return { name: 'file-powerpoint-box', color: '#F97316' };
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return { name: 'file-image', color: '#8B5CF6' };
    if (type.includes('txt')) return { name: 'file-document-edit', color: '#6B7280' };
    return { name: 'file-document', color: theme.colors.primary };
  };

  const fileStyle = getFileIcon(details.file_type);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: isDark ? '#121212' : theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: isDark ? '#121212' : theme.colors.background }]}
    >
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
          {details.title}
        </Text>
        <TouchableOpacity onPress={toggleBookmark}>
          <Icon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={isBookmarked ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.5)' : '#000')}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Icon Section */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
          <LinearGradient
            colors={[fileStyle.color + '30', 'transparent']}
            style={styles.heroGlow}
          />
          <View
            style={[
              styles.largeIconContainer,
              {
                backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface,
                shadowColor: fileStyle.color,
              },
            ]}
          >
            <Icon name={fileStyle.name} size={120} color={fileStyle.color} />
          </View>
          <Text
            style={[
              styles.courseContext,
              { color: fileStyle.color, fontWeight: 'bold', fontSize: 16, marginTop: 8 },
            ]}
          >
            {details.course_unit?.code || 'COURSE'} • {details.resource_type || 'Resource'}
          </Text>
        </Animated.View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Description
          </Text>
          <Text style={[styles.descriptionText, { color: isDark ? 'rgba(255,255,255,0.8)' : '#444' }]}>
            {details.description || 'No description provided for this resource. It was shared by a fellow student to help you excel in your studies.'}
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Icon name="cloud-download-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {details.download_count || 0}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
              Downloads
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Icon name="star-outline" size={24} color="#FBBF24" />
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {details.average_rating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
              Avg. Rating
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Icon name="file-outline" size={24} color={theme.colors.secondary} />
            <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
              {details.file_size || 'N/A'}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }]}>
              File Size
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.contentActions}>
          <TouchableOpacity
            style={[styles.previewBtn, { borderColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('DocumentPreview', { url: details.file_url, title: details.title })}
          >
            <Icon name="eye-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.previewBtnText, { color: theme.colors.primary }]}>Preview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.downloadBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleDownload}
          >
            <Icon name="download" size={22} color="#fff" />
            <Text style={styles.downloadBtnText}>Download</Text>
          </TouchableOpacity>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
            Rate this resource
          </Text>
          <View style={[styles.ratingInputCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRate(star)}
                  style={styles.starTouch}
                >
                  <Icon
                    name={star <= userRating ? 'star' : 'star-outline'}
                    size={36}
                    color={star <= userRating ? '#FBBF24' : (isDark ? 'rgba(255,255,255,0.2)' : '#ccc')}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingHint, { color: theme.colors.outline }]}>
              {userRating > 0 ? `You rated this ${userRating} stars` : 'Tap to rate this resource'}
            </Text>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Comments</Text>
            <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>{comments.length}</Text>
          </View>

          {comments.length === 0 ? (
            <View style={styles.noComments}>
              <Icon name="comment-outline" size={48} color={theme.colors.outline} />
              <Text style={{ color: theme.colors.outline, marginTop: 12 }}>
                No comments yet. Start the conversation!
              </Text>
            </View>
          ) : (
            comments.map((comment, index) => (
              <Animated.View
                key={comment.id || index}
                entering={FadeIn.delay(index * 100)}
                style={[
                  styles.commentCard,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
                ]}
              >
                <View style={styles.commentHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Icon name="account-circle" size={28} color={theme.colors.primary} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={[styles.commentAuthor, { color: isDark ? '#fff' : '#000' }]}>
                        {comment.author_name || 'User'}
                      </Text>
                      <Text style={[styles.commentDate, { color: theme.colors.outline }]}>
                        {comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={[styles.commentText, { color: isDark ? 'rgba(255,255,255,0.8)' : '#333' }]}>
                  {comment.content}
                </Text>
              </Animated.View>
            ))
          )}

          {/* Add Comment */}
          <View style={styles.addCommentRow}>
            <TextInput
              style={[
                styles.commentInput,
                {
                  color: isDark ? '#fff' : '#000',
                  backgroundColor: isDark ? '#232323' : '#f3f3f3',
                },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={isDark ? '#aaa' : '#888'}
              value={newComment}
              onChangeText={setNewComment}
              editable={!submitting}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                {
                  backgroundColor: theme.colors.primary,
                  opacity: submitting || !newComment.trim() ? 0.5 : 1,
                },
              ]}
              onPress={handleAddComment}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Icon name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  largeIconContainer: {
    width: 180,
    height: 180,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  courseContext: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  ratingInputCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  starTouch: {
    padding: 4,
  },
  ratingHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  noComments: {
    padding: 40,
    alignItems: 'center',
  },
  commentCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '800',
  },
  commentDate: {
    fontSize: 12,
    marginTop: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginTop: 4,
  },
  contentActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  previewBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewBtnText: {
    fontSize: 15,
    fontWeight: '900',
  },
  downloadBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  downloadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  addCommentRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    minHeight: 50,
    maxHeight: 120,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ResourceDetailsScreen;