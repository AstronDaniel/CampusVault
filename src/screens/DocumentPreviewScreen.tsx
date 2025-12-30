import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  StatusBar,
  ScrollView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../services/authService';

const { width, height } = Dimensions.get('window');

const DocumentPreviewScreen = ({ route, navigation }: any) => {
  const { url, title, resourceId } = route.params;
  const theme = useTheme();
  const isDark = theme.dark;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<'preparing' | 'downloading' | 'success' | 'error'>('preparing');

  // Helper: Detect file type
  const isImage = (fileUrl?: string) => {
    const ext = fileUrl?.split('.').pop()?.split('?')[0].toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  };

  const isPDF = (fileUrl?: string) => {
    const ext = fileUrl?.split('.').pop()?.split('?')[0].toLowerCase() || '';
    const lower = fileUrl?.toLowerCase() || '';
    return ext === 'pdf' || lower.includes('.pdf');
  };

  // Extract Google Drive ID from various URL formats
  const extractGoogleDriveId = (fileUrl: string): string | null => {
    const patterns = [
      /[?&]id=([^&]+)/,
      /\/d\/([^/]+)/,
      /\/open\?id=([^&]+)/
    ];

    for (const pattern of patterns) {
      const match = fileUrl.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  // Convert Google Drive URL to preview/viewer URL
  const convertGoogleDriveUrl = (fileUrl: string): string => {
    const driveId = extractGoogleDriveId(fileUrl);
    
    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }
    
    return fileUrl;
  };

  // Check if URL is a Google Drive URL
  const isGoogleDriveUrl = (fileUrl?: string): boolean => {
    if (!fileUrl) return false;
    return fileUrl.includes('drive.google.com') || fileUrl.includes('docs.google.com');
  };

  // Logic: Get the appropriate viewer URL
  const getViewerUrl = (fileUrl?: string) => {
    if (!fileUrl) return 'about:blank';
    
    if (isGoogleDriveUrl(fileUrl)) {
      console.log('[DocumentPreview] Original Google Drive URL:', fileUrl);
      const previewUrl = convertGoogleDriveUrl(fileUrl);
      console.log('[DocumentPreview] Converted to preview URL:', previewUrl);
      return previewUrl;
    }
    
    const lower = fileUrl.toLowerCase();
    
    if (lower.endsWith('.pdf')) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
    }
    
    const ext = fileUrl.split('.').pop()?.split('?')[0].toLowerCase();
    const officeTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (officeTypes.includes(ext || '')) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
    }

    return fileUrl;
  };

  // Get download URL (keep the original export=download for actual downloads)
  const getDownloadUrl = (fileUrl?: string): string => {
    if (!fileUrl) return '';
    
    if (fileUrl.includes('export=download')) {
      return fileUrl;
    }
    
    if (isGoogleDriveUrl(fileUrl)) {
      const driveId = extractGoogleDriveId(fileUrl);
      if (driveId) {
        return `https://drive.google.com/uc?id=${driveId}&export=download`;
      }
    }
    
    return fileUrl;
  };

  // Handle download with count update
  const handleDownload = async () => {
    try {
      setDownloadModalVisible(true);
      setDownloadStatus('preparing');

      // Update download count in backend
      if (resourceId) {
        try {
          await authService.recordDownload(Number(resourceId));
          console.log('[DocumentPreview] Download count updated');
        } catch (error) {
          console.error('[DocumentPreview] Failed to update download count:', error);
          // Continue with download even if count update fails
        }
      }

      setDownloadStatus('downloading');

      // Open download URL
      const downloadUrl = getDownloadUrl(url);
      const supported = await Linking.canOpenURL(downloadUrl);
      
      if (supported) {
        await Linking.openURL(downloadUrl);
        setDownloadStatus('success');
        
        // Auto-close modal after success
        setTimeout(() => {
          setDownloadModalVisible(false);
        }, 2000);
      } else {
        setDownloadStatus('error');
      }
    } catch (err) {
      console.error('[DocumentPreview] Download error:', err);
      setDownloadStatus('error');
    }
  };

  const handleOpenBrowser = async () => {
    try {
      const viewUrl = isGoogleDriveUrl(url) 
        ? convertGoogleDriveUrl(url).replace('/preview', '/view')
        : url;
        
      const supported = await Linking.canOpenURL(viewUrl);
      if (supported) {
        await Linking.openURL(viewUrl);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not open browser');
    }
  };

  // Render content based on type
  const renderContent = () => {
    if (!url) {
      return (
        <View style={styles.centerState}>
          <Icon name="file-alert-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.onSurface }]}>No URL available for preview</Text>
          <TouchableOpacity 
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerState}>
          <Icon name="file-alert-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.onSurface }]}>
            Preview unavailable
          </Text>
          <Text style={[styles.errorSubtext, { color: theme.colors.outline }]}>
            This file cannot be previewed in the app
          </Text>
          <TouchableOpacity 
            style={[styles.retryBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleOpenBrowser}
          >
            <Text style={styles.retryText}>Open in Browser</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isImage(url)) {
      return (
        <ScrollView
          maximumZoomScale={3}
          minimumZoomScale={1}
          centerContent={true}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          style={[styles.imageScroll, { backgroundColor: '#000' }]}
        >
          <Image
            source={{ uri: url }}
            style={styles.fullImage}
            resizeMode="contain"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        </ScrollView>
      );
    }

    const viewerUrl = getViewerUrl(url);
    console.log('[DocumentPreview] Loading in WebView:', viewerUrl);

    return (
      <WebView
        source={{ uri: viewerUrl }}
        style={[styles.webview, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        onShouldStartLoadWithRequest={(request) => {
          const reqUrl = request.url;
          console.log('[DocumentPreview] Navigation request:', reqUrl);
          
          if (reqUrl.includes('drive.google.com') && 
              (reqUrl.includes('/preview') || reqUrl.includes('/file/d/'))) {
            return true;
          }
          
          if (reqUrl.includes('docs.google.com/gview')) {
            return true;
          }
          
          if (reqUrl === viewerUrl) {
            return true;
          }
          
          if (reqUrl.includes('export=download') || reqUrl.includes('/uc?id=')) {
            console.log('[DocumentPreview] Blocked download URL:', reqUrl);
            return false;
          }
          
          return true;
        }}
        renderLoading={() => (
          <View style={[styles.loaderCover, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={[styles.loaderText, { color: theme.colors.secondary }]}>
              Loading Document...
            </Text>
          </View>
        )}
        onLoadEnd={() => {
          console.log('[DocumentPreview] Document loaded');
          setLoading(false);
        }}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[DocumentPreview] WebView error:', nativeEvent);
          setLoading(false);
          setError(true);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[DocumentPreview] HTTP error:', nativeEvent.statusCode);
          setLoading(false);
          setError(true);
        }}
      />
    );
  };

  // Render Download Modal
  const renderDownloadModal = () => (
    <Modal
      visible={downloadModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {
        if (downloadStatus !== 'downloading') {
          setDownloadModalVisible(false);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
          {downloadStatus === 'preparing' && (
            <>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Preparing Download
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.outline }]}>
                Please wait...
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
              <View style={[styles.successIcon, { backgroundColor: '#10B981' + '20' }]}>
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
              <View style={[styles.errorIcon, { backgroundColor: '#EF4444' + '20' }]}>
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
                onPress={() => setDownloadModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1E1E1E' : '#fff'} />
      
      {/* HEADER */}
      <SafeAreaView edges={['top']} style={[styles.headerContainer, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icon name="close" size={24} color={isDark ? '#fff' : '#333'} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
              {title || 'Document Preview'}
            </Text>
            <Text style={[styles.headerUrl, { color: theme.colors.outline }]} numberOfLines={1}>
              {isPDF(url) ? 'PDF Document' : isImage(url) ? 'Image' : 'Document'}
            </Text>
          </View>

          <TouchableOpacity onPress={handleDownload} style={styles.iconBtn}>
            <Icon name="download-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleOpenBrowser} style={styles.iconBtn}>
            <Icon name="open-in-new" size={24} color={isDark ? '#fff' : '#333'} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* BODY */}
      <View style={styles.body}>
        {renderContent()}
        
        {/* Absolute Loader for Image */}
        {loading && isImage(url) && (
          <View style={[styles.loaderCover, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
             <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
      </View>

      {/* Download Modal */}
      {renderDownloadModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerContent: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerUrl: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  imageScroll: {
    flex: 1,
  },
  fullImage: {
    width: width,
    height: height * 0.8, 
  },
  webview: {
    flex: 1,
    opacity: 0.99,
  },
  loaderCover: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  errorSubtext: {
    marginBottom: 24,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    maxWidth: 320,
    borderRadius: 20,
    padding: 32,
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
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtn: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  modalBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default DocumentPreviewScreen;