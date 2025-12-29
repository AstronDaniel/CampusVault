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
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const DocumentPreviewScreen = ({ route, navigation }: any) => {
  const { url, title } = route.params;
  const theme = useTheme();
  const isDark = theme.dark;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Helper: Detect file type
  const isImage = (fileUrl?: string) => {
    const ext = fileUrl?.split('.').pop()?.split('?')[0].toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
  };

  // Logic: Google Docs Viewer handles PDF, DOC, XLS, PPT inside a WebView
  // We use 'embedded=true' to strip the Google UI
  const getViewerUrl = (fileUrl?: string) => {
    if (!fileUrl) return 'about:blank';
    const lower = fileUrl.toLowerCase();
    if (Platform.OS === 'android' && lower.endsWith('.pdf')) {
      // Android WebView cannot render PDF natively, must use Google Viewer
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
    }
    // For other docs (DOCX, PPTX), Google Viewer is also the safest bet for a "Preview"
    // However, if it's a raw website or generic link, we use it directly.
    const ext = fileUrl.split('.').pop()?.split('?')[0].toLowerCase();
    const officeTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (officeTypes.includes(ext || '')) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fileUrl)}`;
    }

    return fileUrl;
  };

  const handleDownload = async () => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this URL');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const handleOpenBrowser = () => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open browser'));
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
            onPress={() => Alert.alert('No URL', 'This resource does not have a previewable URL.')}
          >
            <Text style={styles.retryText}>OK</Text>
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

    return (
      <WebView
        source={{ uri: getViewerUrl(url) }}
        style={[styles.webview, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        renderLoading={() => (
          <View style={[styles.loaderCover, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
            <ActivityIndicator color={theme.colors.primary} size="large" />
            <Text style={[styles.loaderText, { color: theme.colors.secondary }]}>
              Loading Document...
            </Text>
          </View>
        )}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        onHttpError={() => {
          setLoading(false);
          setError(true);
        }}
      />
    );
  };

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
              {url}
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
        
        {/* Absolute Loader for Image (since Image doesn't have renderLoading prop like WebView) */}
        {loading && isImage(url) && (
          <View style={[styles.loaderCover, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
             <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
      </View>
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
  // Image Styles
  imageScroll: {
    flex: 1,
  },
  fullImage: {
    width: width,
    height: height * 0.8, 
  },
  // WebView Styles
  webview: {
    flex: 1,
    opacity: 0.99, // Hack to prevent android crash on some devices
  },
  // Loader
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
  // Error State
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    fontSize: 16,
    fontWeight: '600',
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
});

export default DocumentPreviewScreen;