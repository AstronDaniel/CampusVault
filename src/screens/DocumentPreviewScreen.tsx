import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

const DocumentPreviewScreen = ({ route, navigation }: any) => {
    const { url, title } = route.params;
    const theme = useTheme();
    const isDark = theme.dark;
    const [loading, setLoading] = useState(true);

    const isImage = (url: string) => {
        const ext = url?.split('.').pop()?.toLowerCase() || '';
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    };

    const googleDocsUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
            {/* STICKY HEADER */}
            <View style={[styles.header, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="close" size={26} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                    {title || 'Document Preview'}
                </Text>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => { /* Logic for actual download */ }}
                >
                    <Icon name="download" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {isImage(url) ? (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: url }}
                            style={styles.fullImage}
                            resizeMode="contain"
                            onLoadEnd={() => setLoading(false)}
                        />
                        {loading && <ActivityIndicator color={theme.colors.primary} size="large" style={StyleSheet.absoluteFill} />}
                    </View>
                ) : (
                    <WebView
                        source={{ uri: googleDocsUrl }}
                        style={styles.webview}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View style={styles.loaderCover}>
                                <ActivityIndicator color={theme.colors.primary} size="large" />
                                <Text style={[styles.loaderText, { color: theme.colors.outline }]}>Powering up the viewer...</Text>
                            </View>
                        )}
                        onLoadEnd={() => setLoading(false)}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        zIndex: 100,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '900',
        flex: 1,
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    fullImage: {
        width: width,
        height: height - 150,
    },
    loaderCover: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    loaderText: {
        marginTop: 15,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default DocumentPreviewScreen;
