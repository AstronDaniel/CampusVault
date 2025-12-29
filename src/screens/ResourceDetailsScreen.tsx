import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { authService } from '../services/authService';

const { width } = Dimensions.get('window');

interface Comment {
  id: string;
  author_name?: string;
  content?: string;
  body?: string;
  created_at?: string;
  author?: any;
}

interface CourseUnit {
  code: string;
}

interface Resource {
  id: string;
  title: string;
  description?: string;
  file_type: string;
  file_url: string;
  file_size?: string | number;
  size_bytes?: number;
  content_type?: string;
  resource_type?: string;
  download_count?: number;
  average_rating?: number;
  user_rating?: number;
  is_bookmarked: boolean;
  course_unit?: CourseUnit;
  uploader_name?: string;
  uploaded_by?: string;
  fileUrl?: string;
  url?: string;
  file?: string;
  download_url?: string;
  downloadUrl?: string;
  link?: string;
  filepath?: string;
  path?: string;
  size?: number;
  bytes?: number;
}

interface RouteParams {
  resource: Resource;
}

type DownloadStatus = 'preparing' | 'downloading' | 'success' | 'error';

const ResourceDetailsScreen = ({ route, navigation }: any) => {
 const resource = route.params?.resource || {};
  const theme = useTheme();
  const isDark = theme.dark;

  const [details, setDetails] = useState<Resource>(resource);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(resource?.is_bookmarked||false);
  const [userRating, setUserRating] = useState(resource.user_rating || 0);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('preparing');
  const uploaderName = resource?.uploader_name || 'Unknown';

  const averageRating = resource?.average_rating || 0;
  useEffect(() => {
    if (details && details.id) {
      fetchResourceDetails();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchResourceDetails = async () => {
    try {
      setLoading(true);
      const resourceData = await authService.getResourceById(Number(details.id));
      const commentsData = await authService.getComments(Number(details.id));
      
      if (resourceData) {
        console.log('[ResourceDetailsScreen] resourceData:', resourceData);
        const normalized: Resource = { ...resourceData };
        
        // Normalize file URL
        normalized.file_url = resourceData.file_url || 
                             resourceData.fileUrl || 
                             resourceData.url || 
                             resourceData.file || 
                             resourceData.download_url || 
                             resourceData.downloadUrl || 
                             resourceData.link || 
                             resourceData.filepath || 
                             resourceData.path || '';
        
        // Normalize file size
        if (!normalized.file_size) {
          const raw = resourceData.file_size || 
                     resourceData.size_bytes || 
                     resourceData.size || 
                     resourceData.bytes;
          
          if (raw !== undefined && raw !== null) {
            if (typeof raw === 'number') {
              if (raw >= 1024 * 1024) {
                normalized.file_size = (raw / (1024 * 1024)).toFixed(2) + ' MB';
              } else if (raw >= 1024) {
                normalized.file_size = (raw / 1024).toFixed(2) + ' KB';
              } else {
                normalized.file_size = raw + ' B';
              }
            } else {
              normalized.file_size = String(raw);
            }
          }
        }
        
        setDetails(normalized);
        setIsBookmarked(normalized.is_bookmarked);
        setUserRating(normalized.user_rating || 0);
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
      setIsBookmarked(!isBookmarked);
      Alert.alert('Error', 'Failed to update bookmark');
    }
  };

  const handleRate = async (rating: number) => {
    try {
      setUserRating(rating);
      await authService.rateResource(Number(details.id), rating);
      
      const currentAvg = details.average_rating || 0;
      const currentCount = details.download_count || 0;
      const newAverage = currentCount > 0 
        ? ((currentAvg * currentCount + rating) / (currentCount + 1))
        : rating;
      
      setDetails({ 
        ...details, 
        average_rating: newAverage, 
        user_rating: rating 
      });
    } catch (error) {
      console.error('Error rating resource:', error);
      Alert.alert('Error', 'Failed to submit rating');
      setUserRating(details.user_rating || 0);
    }
  };

  const getDownloadUrl = (fileUrl?: string): string => {
    if (!fileUrl) return '';
    
    if (fileUrl.includes('export=download')) {
      return fileUrl;
    }
    
    // Extract Google Drive ID if it's a Drive URL
    if (fileUrl.includes('drive.google.com')) {
      const patterns = [
        /[?&]id=([^&]+)/,
        /\/d\/([^/]+)/,
        /\/open\?id=([^&]+)/
      ];

      for (const pattern of patterns) {
        const match = fileUrl.match(pattern);
        if (match && match[1]) {
          return `https://drive.google.com/uc?id=${match[1]}&export=download`;
        }
      }
    }
    
    return fileUrl;
  };

  const handleDownload = async () => {
    try {
      if (!details.file_url) {
        Alert.alert('Error', 'Download URL not available');
        return;
      }

      setDownloadModalVisible(true);
      setDownloadStatus('preparing');

      // Update download count in backend
      try {
        await authService.recordDownload(Number(details.id));
        console.log('[ResourceDetails] Download count updated');
        
        setDetails({ 
          ...details, 
          download_count: (details.download_count || 0) + 1 
        });
      } catch (error) {
        console.error('[ResourceDetails] Failed to update download count:', error);
      }

      setDownloadStatus('downloading');

      const downloadUrl = getDownloadUrl(details.file_url);
      const supported = await Linking.canOpenURL(downloadUrl);
      
      if (supported) {
        await Linking.openURL(downloadUrl);
        setDownloadStatus('success');
        
        setTimeout(() => {
          setDownloadModalVisible(false);
          setDownloadStatus('preparing');
        }, 2000);
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setDownloadStatus('error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const newCommentObj = await authService.addComment(
        Number(details.id), 
        newComment.trim()
      );
      
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

  const getFileTypeTag = (contentType: string) => {
    const type = contentType?.toLowerCase() || '';
    if (type.includes('pdf')) return { label: 'PDF', color: '#EF4444' };
    if (type.includes('word') || type.includes('doc')) return { label: 'DOC', color: '#2563EB' };
    if (type.includes('excel') || type.includes('sheet') || type.includes('xls') || type.includes('csv')) return { label: 'XLS', color: '#10B981' };
    if (type.includes('powerpoint') || type.includes('presentation') || type.includes('ppt')) return { label: 'PPT', color: '#F97316' };
    if (type.includes('image') || type.includes('jpg') || type.includes('jpeg') || type.includes('png') || type.includes('gif')) return { label: 'IMG', color: '#8B5CF6' };
    if (type.includes('text') || type.includes('txt')) return { label: 'TXT', color: '#6B7280' };
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return { label: 'ZIP', color: '#64748B' };
    return { label: 'FILE', color: '#9CA3AF' };
  };

  const formatFileSize = (rawSize: any): string => {
    if (rawSize === undefined || rawSize === null) return 'N/A';
    if (typeof rawSize === 'string') return rawSize;
    
    const size = Number(rawSize);
    if (Number.isNaN(size)) return String(rawSize);
    
    if (size >= 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' MB';
    if (size >= 1024) return (size / 1024).toFixed(2) + ' KB';
    return size + ' B';
  };

  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    // If the server returns an ISO string without timezone info, treat it as UTC.
    let ds = String(dateString);
    if (!/[zZ]|[+\-]\d{2}:?\d{2}$/.test(ds)) {
      ds = ds + 'Z';
    }
    const d = new Date(ds);
    if (isNaN(d.getTime())) return '';
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  };

  const getAuthorDisplayName = (comment: Comment) => {
    if (!comment) return 'Anonymous';
    if ((comment as any).username && String((comment as any).username).trim()) return String((comment as any).username).trim();
    if (comment.author_name && String(comment.author_name).trim()) return String(comment.author_name).trim();
    const author = comment.author as any;
    if (author) {
      if (author.name && String(author.name).trim()) return String(author.name).trim();
      if (author.username && String(author.username).trim()) return String(author.username).trim();
      const first = author.first_name || author.firstName || author.first || '';
      const last = author.last_name || author.lastName || author.last || '';
      const full = `${first} ${last}`.trim();
      if (full) return full;
    }
    return 'Anonymous';
  };

  const renderDownloadModal = () => (
    <Modal
      visible={downloadModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (downloadStatus !== 'downloading') {
          setDownloadModalVisible(false);
          setDownloadStatus('preparing');
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContent, 
          { backgroundColor: isDark ? '#1E1E1E' : '#fff' }
        ]}>
          {downloadStatus === 'preparing' && (
            <>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Preparing Download
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.outline }]}>
                Updating download count...
              </Text>
            </>
          )}

          {downloadStatus === 'downloading' && (
            <>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Downloading
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.outline }]}>
                Opening in browser...
              </Text>
            </>
          )}

          {downloadStatus === 'success' && (
            <>
              <View style={[styles.successIcon, { backgroundColor: '#10B98120' }]}>
                <Icon name="check-circle" size={48} color="#10B981" />
              </View>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Download Started!
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.outline }]}>
                Check your browser's downloads
              </Text>
            </>
          )}

          {downloadStatus === 'error' && (
            <>
              <View style={[styles.errorIcon, { backgroundColor: '#EF444420' }]}>
                <Icon name="alert-circle" size={48} color="#EF4444" />
              </View>
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Download Failed
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.outline }]}>
                Could not open download URL
              </Text>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setDownloadModalVisible(false);
                  setDownloadStatus('preparing');
                }}
              >
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const fileStyle = getFileIcon(details.file_type);
  const typeTag = getFileTypeTag(details.file_type || details.content_type || '');

  if (loading) {
    return (
      <View style={[
        styles.container, 
        styles.centered, 
        { backgroundColor: isDark ? '#121212' : theme.colors.background }
      ]}>
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
          {details.title ?? ''}
        </Text>
        <TouchableOpacity onPress={toggleBookmark}>
          <Icon
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={isBookmarked ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.5)' : '#000')}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Animated.View 
          entering={FadeInDown.duration(500)} 
          style={[
            styles.headerCard, 
            { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface }
          ]}
        >
          <View style={styles.headerTop}>
            <View style={[styles.thumbnail, { backgroundColor: fileStyle.color + '15' }]}>
              <Icon name={fileStyle.name} size={40} color={fileStyle.color} />
            </View>
            
            <View style={styles.headerInfo}>
              <Text 
                style={[styles.resourceTitle, { color: isDark ? '#fff' : '#000' }]} 
                numberOfLines={2}
              >
                {details.title ?? ''}
              </Text>
              
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: typeTag.color + '20' }]}>
                  <Text style={[styles.tagText, { color: typeTag.color }]}>
                    {typeTag.label}
                  </Text>
                </View>
                {details.resource_type && (
                  <View style={[styles.tag, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                    <Text style={[styles.tagText, { color: isDark ? '#ccc' : '#555' }]}>
                      {details.resource_type?.toUpperCase() ?? ''}
                    </Text>
                  </View>
                )}
                {details.course_unit?.code && (
                  <View style={[styles.tag, { backgroundColor: isDark ? '#333' : '#eee' }]}>
                    <Text style={[styles.tagText, { color: isDark ? '#ccc' : '#555' }]}>
                      {details.course_unit.code}
                    </Text>
                  </View>
                )}
              </View>

                  <Text style={[styles.uploaderText, { color: isDark ? '#aaa' : '#666' }]}
                  >
                Uploaded by <Text style={{fontWeight: '700'}}>
                  {details.uploader_name || details.uploaded_by || 'Anonymous'}
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text 
              style={[styles.descriptionText, { color: isDark ? '#ddd' : '#444' }]} 
              numberOfLines={3}
            >
              {details.description ?? `This resource is provided for the course ${details.course_unit?.code || ''}. It is available for download and preview.`}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#eee' }]} />

          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Icon name="cloud-download-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
                {details.download_count || 0}
              </Text>
            </View>
            <View style={[styles.verticalDivider, { backgroundColor: isDark ? '#333' : '#eee' }]} />
            <View style={styles.statItem}>
              <Icon name="star" size={16} color="#FBBF24" />
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
                {details.average_rating?.toFixed(1) || '0.0'}
              </Text>
            </View>
            <View style={[styles.verticalDivider, { backgroundColor: isDark ? '#333' : '#eee' }]} />
            <View style={styles.statItem}>
              <Icon name="file-outline" size={16} color={theme.colors.secondary} />
              <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>
                {formatFileSize(details.file_size || details.size_bytes)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('DocumentPreview', { 
              url: details.file_url, 
              title: details.title,
              resourceId: details.id 
            })}
          >
            <Icon name="eye-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.btnText, { color: theme.colors.primary }]}>
              Preview
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleDownload}
          >
            <Icon name="download" size={20} color="#fff" />
            <Text style={[styles.btnText, { color: '#fff' }]}>
              Download
            </Text>
          </TouchableOpacity>
        </View>

        {/* Rating Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#fff' : '#000' }]}>
            Rate Resource
          </Text>
          <View style={[
            styles.ratingCard, 
            { backgroundColor: isDark ? '#1E1E1E' : '#f8f9fa' }
          ]}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => handleRate(star)} 
                  style={styles.starBtn}
                >
                  <Icon
                    name={star <= userRating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= userRating ? '#FBBF24' : '#ccc'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.ratingLabel, { color: theme.colors.outline }]}>
              {userRating > 0 ? `You rated this ${userRating} stars` : 'Tap a star to rate'}
            </Text>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.commentSectionHeader}>
            <Text style={[styles.sectionHeaderTitle, { color: isDark ? '#fff' : '#000' }]}>
              Comments
            </Text>
            <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: '700' }}>
                {comments.length}
              </Text>
            </View>
          </View>

          {/* Add Comment Input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={[
                styles.commentInput,
                {
                  color: isDark ? '#fff' : '#000',
                  backgroundColor: isDark ? '#1E1E1E' : '#fff',
                  borderColor: isDark ? '#333' : '#e0e0e0',
                },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={isDark ? '#aaa' : '#999'}
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
                <Icon name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          {comments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ color: theme.colors.outline }}>
                No comments yet. Be the first to comment!
              </Text>
            </View>
          ) : (
            comments.map((comment, index) => (
              <Animated.View
                key={comment.id || index}
                entering={FadeIn.delay(index * 100)}
                style={[
                  styles.commentItem,
                  { 
                    backgroundColor: isDark ? '#1E1E1E' : '#fff', 
                    borderColor: isDark ? '#333' : '#f0f0f0' 
                  },
                ]}
              >
                <View style={styles.commentHeader}>
                  <View style={styles.commentUser}>
                    <Icon name="account-circle" size={24} color={theme.colors.primary} />
                    <Text style={[styles.commentAuthor, { color: isDark ? '#fff' : '#000' }]}>
                        {getAuthorDisplayName(comment)}
                    </Text>
                  </View>
                    <Text style={[styles.commentDate, { color: theme.colors.outline }]}>
                      {formatRelativeTime(comment.created_at)}
                    </Text>
                </View>
                  <Text style={[styles.commentContent, { color: isDark ? '#ddd' : '#333' }]}>
                    {comment.body ?? comment.content ?? ''}
                  </Text>
              </Animated.View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Download Modal */}
      {renderDownloadModal()}
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
    paddingBottom: 20,
  },
  headerCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  tag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  uploaderText: {
    fontSize: 12,
  },
  descriptionContainer: {
    marginTop: 12,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  outlineBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  ratingCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starBtn: {
    padding: 2,
  },
  ratingLabel: {
    fontSize: 12,
  },
  commentSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  commentItem: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentDate: {
    fontSize: 11,
  },
  commentContent: {
    fontSize: 13,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default ResourceDetailsScreen;