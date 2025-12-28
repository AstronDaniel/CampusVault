import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Linking, Alert } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import { authService } from '../services/authService';

const ResourceDetailsScreen = ({ route, navigation }: any) => {
    const { resource } = route.params;
    const theme = useTheme();
    const isDark = theme.dark;

    const [details, setDetails] = useState<any>(resource);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(resource.is_bookmarked);
    const [userRating, setUserRating] = useState(resource.user_rating || 0);

    useEffect(() => {
        loadData();
    }, []);

    const fileStyle = getFileIcon(details.file_type);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.container, { backgroundColor: isDark ? '#121212' : theme.colors.background }]}
        >
            <View style={styles.navBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.navTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                    {details.title}
                </Text>
                <TouchableOpacity onPress={toggleBookmark}>
                    <Icon
                        name={isBookmarked ? "bookmark" : "bookmark-outline"}
                        size={26}
                        color={isBookmarked ? theme.colors.primary : (isDark ? 'rgba(255,255,255,0.5)' : '#000')}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* HERO ICON SECTION */}
                <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
                    <LinearGradient
                        colors={[fileStyle.color + '30', 'transparent']}
                        style={styles.heroGlow}
                    />
                    <View style={[styles.largeIconContainer, { backgroundColor: isDark ? '#1E1E1E' : theme.colors.surface, shadowColor: fileStyle.color }]}> 
                        <Icon
                            name={fileStyle.name}
                            size={120}
                            color={fileStyle.color}
                        />
                    </View>
                    <Text style={[styles.courseContext, { color: fileStyle.color, fontWeight: 'bold', fontSize: 16, marginTop: 8 }]}>
                        {details.course_unit?.code || 'CS101'} • {details.resource_type || 'Resource'}
                    </Text>
                </Animated.View>

                {/* DESCRIPTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000', fontSize: 18, fontWeight: 'bold' }]}>Description</Text>
                    <Text style={[styles.descriptionText, { color: isDark ? 'rgba(255,255,255,0.8)' : '#444', fontSize: 15 }]}> 
                        {details.description || 'No description provided for this resource. It was shared by a fellow student to help you excel in your studies.'}
                    </Text>
                </View>

                {/* STATS GLASS CARDS */}
                <View style={[styles.statsRow, { marginBottom: 10 }]}> 
                    <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}> 
                        <Icon name="cloud-download-outline" size={24} color={theme.colors.primary} />
                        <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{details.download_count || 0}</Text>
                        <Text style={styles.statLabel}>Downloads</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}> 
                        <Icon name="star-outline" size={24} color="#FBBF24" />
                        <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{details.average_rating || '0.0'}</Text>
                        <Text style={styles.statLabel}>Avg. Rating</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}> 
                        <Icon name="file-outline" size={24} color={theme.colors.secondary} />
                        <Text style={[styles.statValue, { color: isDark ? '#fff' : '#000' }]}>{details.file_size || 'N/A'}</Text>
                        <Text style={styles.statLabel}>File Size</Text>
                    </View>
                </View>

                {/* ACTION BUTTONS */}
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

                {/* RATING SECTION (Interactive) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Rate this resource</Text>
                    <View style={[styles.ratingInputCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}> 
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => handleRate(star)}
                                    style={styles.starTouch}
                                >
                                    <Icon
                                        name={star <= userRating ? "star" : "star-outline"}
                                        size={36}
                                        color={star <= userRating ? "#FBBF24" : (isDark ? 'rgba(255,255,255,0.2)' : '#ccc')}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={[styles.ratingHint, { color: theme.colors.outline }]}> 
                            {userRating > 0 ? `You rated this ${userRating} stars` : 'Tap to rate this resource'}
                        </Text>
                    </View>
                </View>

                {/* COMMENTS SECTION */}
                <View style={[styles.section, { marginBottom: 120 }]}> 
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Comments</Text>
                        <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>{comments.length}</Text>
                    </View>

                    {comments.length === 0 ? (
                        <View style={styles.noComments}>
                            <Text style={{ color: theme.colors.outline }}>No comments yet. Start the conversation!</Text>
                        </View>
                    ) : (
                        comments.map((comment: any, index: number) => (
                            <Animated.View key={comment.id || index} entering={FadeIn.delay(index * 100)} style={styles.commentCard}>
                                <View style={styles.commentHeader}>
                                    <Icon name="account-circle" size={28} color={theme.colors.primary} />
                                    <View style={{ marginLeft: 10 }}>
                                        <Text style={[styles.commentAuthor, { color: isDark ? '#fff' : '#000' }]}>{comment.author_name || 'User'}</Text>
                                        <Text style={[styles.commentDate, { color: theme.colors.outline }]}>{comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}</Text>
                                    </View>
                                </View>
                                <Text style={[styles.commentText, { color: isDark ? 'rgba(255,255,255,0.8)' : '#333' }]}>{comment.content}</Text>
                            </Animated.View>
                        ))
                    )}

                    {/* Add Comment */}
                    <View style={styles.addCommentRow}>
                        <TextInput
                            style={[styles.commentInput, { color: isDark ? '#fff' : '#000', backgroundColor: isDark ? '#232323' : '#f3f3f3' }]}
                            placeholder="Add a comment..."
                            placeholderTextColor={isDark ? '#aaa' : '#888'}
                            value={newComment}
                            onChangeText={setNewComment}
                            editable={!submitting}
                        />
                        <TouchableOpacity
                            style={[styles.sendBtn, { backgroundColor: theme.colors.primary, opacity: submitting ? 0.5 : 1 }]}
                            onPress={handleAddComment}
                            disabled={submitting}
                        >
                            <Icon name="send" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>
        </KeyboardAvoidingView>
                    >
                        <Icon name="download" size={22} color="#fff" />
                        <Text style={styles.downloadBtnText}>Download</Text>
                    </TouchableOpacity>
                </View>

                {/* RATING SECTION (Interactive) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Rate this resource</Text>
                    <View style={[styles.ratingInputCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => handleRate(star)}
                                    style={styles.starTouch}
                                >
                                    <Icon
                                        name={star <= userRating ? "star" : "star-outline"}
                                        size={36}
                                        color={star <= userRating ? "#FBBF24" : (isDark ? 'rgba(255,255,255,0.2)' : '#ccc')}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={[styles.ratingHint, { color: theme.colors.outline }]}>
                            {userRating > 0 ? `You rated this ${userRating} stars` : 'Tap to rate this resource'}
                        </Text>
                    </View>
                </View>

                {/* DESCRIPTION */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Description</Text>
                    <Text style={[styles.descriptionText, { color: isDark ? 'rgba(255,255,255,0.6)' : '#666' }]}>
                        {details.description || 'No description provided for this resource. It was shared by a fellow student to help you excel in your studies.'}
                    </Text>
                </View>

                {/* COMMENTS SECTION */}
                <View style={[styles.section, { marginBottom: 120 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>Comments</Text>
                        <Text style={{ color: theme.colors.primary, fontWeight: '800' }}>{comments.length}</Text>
                    </View>

                    {comments.length === 0 ? (
                        <View style={styles.noComments}>
                            <Text style={{ color: theme.colors.outline }}>No comments yet. Start the conversation!</Text>
                        </View>
                    ) : (
                        comments.map((comment: any, index: number) => (
                            <Animated.View
                                key={comment.id}
                                entering={FadeInDown.delay(index * 50)}
                                style={[styles.commentCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9f9f9' }]}
                            >
                                <View style={styles.commentHeader}>
                                    <Text style={[styles.commentUser, { color: isDark ? '#fff' : '#000' }]}>@{comment.user?.username || 'user'}</Text>
                                    <Text style={styles.commentTime}>2h ago</Text>
                                </View>
                                <Text style={[styles.commentContent, { color: isDark ? 'rgba(255,255,255,0.7)' : '#444' }]}>{comment.content}</Text>
                            </Animated.View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* ACTION FOOTER (Sticky Comment Input) */}
            <BlurView
                style={styles.footer}
                blurType={isDark ? "dark" : "light"}
                blurAmount={15}
            >
                <View style={styles.commentInputRow}>
                    <TextInput
                        style={[styles.input, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', color: isDark ? '#fff' : '#000' }]}
                        placeholder="Write a comment..."
                        placeholderTextColor={theme.colors.outline}
                        value={newComment}
                        onChangeText={setNewComment}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handleAddComment}
                        disabled={submitting}
                    >
                        {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </BlurView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 15,
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '900',
        flex: 1,
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    heroSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    heroGlow: {
        position: 'absolute',
        top: -50,
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    largeIconContainer: {
        width: 180,
        height: 180,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        marginBottom: 20,
    },
    mainTitle: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 8,
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
        color: 'rgba(255,255,255,0.4)',
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
        padding: 20,
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
        marginBottom: 6,
    },
    commentUser: {
        fontSize: 14,
        fontWeight: '800',
    },
    commentTime: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.3)',
    },
    commentContent: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingBottom: 40,
        paddingTop: 15,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    contentActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 30,
    },
    commentInputRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    input: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        paddingHorizontal: 16,
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
    mainActions: {
        flexDirection: 'row',
        gap: 12,
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
});

export default ResourceDetailsScreen;
