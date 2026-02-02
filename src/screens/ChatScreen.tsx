import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Keyboard,
    StatusBar,
    Dimensions,
} from 'react-native';
import { useTheme, Surface, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Realtime } from 'ably';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const USER_COLORS = ['#FF6B6B', '#4DABF7', '#51CF66', '#845EF7', '#FCC419', '#339AF0', '#228BE6', '#BE4BDB', '#12B886', '#FAB005'];
const ADMIN_COLOR = '#FF8C00';

const getUserColor = (id: number) => {
    if (!id) return USER_COLORS[0];
    return USER_COLORS[id % USER_COLORS.length];
};

const ChatScreen = ({ route, navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { otherUser } = route.params || {}; // expect { id: number, full_name: string, avatar_url?: string }

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');
    const [replyingTo, setReplyingTo] = useState<any | null>(null);

    const ably = useRef<Realtime | null>(null);
    const channel = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);

    // NEUTRAL DARK GRAY THEME
    const isDark = theme.dark;
    const bgColor = theme.colors.background;
    const headerBg = isDark ? theme.colors.surface : '#FFFFFF';
    const borderColor = isDark ? theme.colors.surfaceVariant : '#E5E7EB';
    const textColor = isDark ? '#FFFFFF' : '#111827';
    const subTextColor = isDark ? '#A1A1AA' : '#6B7280';

    // Fetch History
    useEffect(() => {
        if (!otherUser?.id) return;

        const fetchHistory = async () => {
            try {
                const history = await authService.getChatHistory(otherUser.id);
                setMessages(history);
                // Sync unread status
                await authService.markMessagesAsRead(otherUser.id);
            } catch (error) {
                console.error('[StudentChat] Failed to fetch chat history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [otherUser?.id]);

    const connect = useCallback(async () => {
        if (!user?.id) return;

        try {
            setConnectionStatus('connecting');
            const realtime = new Realtime({
                authCallback: async (tokenParams, callback) => {
                    try {
                        const tokenRequest = await authService.getAblyToken();
                        callback(null, tokenRequest);
                    } catch (err) {
                        callback(err as any, null);
                    }
                }
            });

            ably.current = realtime;

            realtime.connection.on('connected', () => {
                setConnectionStatus('connected');
            });

            realtime.connection.on('disconnected', () => {
                setConnectionStatus('disconnected');
            });

            realtime.connection.on('failed', () => {
                setConnectionStatus('error');
            });

            // Subscribe to user-specific channel
            const userChannel = realtime.channels.get(`user-${user.id}`);
            channel.current = userChannel;

            userChannel.subscribe('message', (message) => {
                const data = message.data;
                // Only add message if it's part of this conversation
                if (
                    (data.sender_id === otherUser?.id && data.receiver_id === user?.id) ||
                    (data.sender_id === user?.id && data.receiver_id === otherUser?.id)
                ) {
                    setMessages((prev) => {
                        if (prev.some(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });

                    // If incoming, mark as read immediately
                    if (data.sender_id === otherUser?.id) {
                        authService.markMessagesAsRead(otherUser.id).catch(err =>
                            console.error('[StudentChat] Failed to sync read status:', err)
                        );
                    }
                }
            });

            // Read sync event (e.g. read on web/tab)
            userChannel.subscribe('read_sync', (message) => {
                const { other_user_id } = message.data;
                if (other_user_id === otherUser?.id) {
                    // Logic to clear local unread if we had it, but mostly useful for sidebar/badges
                    console.log('[StudentChat] Conversation marked as read elsewhere');
                }
            });

        } catch (error) {
            console.error('[StudentChat] Ably setup error:', error);
            setConnectionStatus('error');
        }
    }, [otherUser?.id, user?.id]);

    useEffect(() => {
        connect();
        return () => {
            if (ably.current) {
                ably.current.close();
            }
        };
    }, [connect]);

    const handleSend = async () => {
        if (!inputText.trim() || connectionStatus !== 'connected' || !otherUser?.id) return;

        const content = inputText.trim();
        const rId = replyingTo?.id || null;

        setInputText('');
        setReplyingTo(null);

        try {
            const savedMsg = await authService.sendMessage(otherUser.id, content, rId);
            setMessages((prev) => {
                if (prev.some(m => m.id === savedMsg.id)) return prev;
                return [...prev, savedMsg];
            });
        } catch (e) {
            console.error('[StudentChat] Failed to send message:', e);
            setInputText(content);
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id == user?.id;
        const senderName = isMe ? 'You' : otherUser.full_name;

        return (
            <Animated.View
                entering={FadeIn.duration(400)}
                style={[
                    styles.messageRoot,
                    { borderLeftWidth: 2, borderLeftColor: isMe ? getUserColor(Number(user?.id || 0)) : ADMIN_COLOR }
                ]}
            >
                <View style={styles.messageHeader}>
                    <Avatar.Image
                        size={24}
                        source={{ uri: isMe ? user?.avatar_url : otherUser.avatar_url || 'https://via.placeholder.com/24' }}
                        style={styles.senderAvatar}
                    />
                    <Text style={[styles.senderName, { color: isMe ? getUserColor(Number(user?.id || 0)) : ADMIN_COLOR }]}>
                        {senderName}
                    </Text>
                    <Text style={[styles.messageBullet, { color: subTextColor }]}>•</Text>
                    <Text style={[styles.messageTime, { color: subTextColor }]}>
                        {formatTime(item.timestamp)}
                    </Text>
                </View>

                {item.reply_to_content && (
                    <TouchableOpacity
                        style={[styles.replyQuote, { backgroundColor: isDark ? '#121212' : '#F1F5F9', borderLeftColor: theme.colors.primary }]}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.replyQuoteText, { color: subTextColor }]} numberOfLines={2}>
                            {item.reply_to_content}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.messageBody}>
                    <Text style={[styles.messageText, { color: textColor }]}>
                        {item.content}
                    </Text>
                </View>

                {!isMe && (
                    <View style={styles.messageActions}>
                        <TouchableOpacity style={styles.actionIcon} onPress={() => setReplyingTo(item)}>
                            <Icon name="reply-outline" size={16} color={subTextColor} />
                            <Text style={[styles.actionText, { color: subTextColor }]}>Reply</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* REDDIT-STYLE TOP NAV */}
            <View style={[styles.navHeader, { backgroundColor: headerBg, borderBottomColor: borderColor, paddingTop: insets.top + 10 }]}>
                <View style={styles.navMain}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBack}>
                        <Icon name="arrow-left" size={24} color={textColor} />
                    </TouchableOpacity>

                    <View style={styles.navUserInfo}>
                        <Text style={[styles.navTitle, { color: textColor }]}>Admin</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'connected' ? '#4ADE80' : '#EF4444' }]} />
                            <Text style={[styles.statusText, { color: subTextColor }]}>{otherUser.full_name}</Text>
                        </View>
                    </View>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator color={theme.colors.primary} size="large" />
                </View>
            ) : (
                <>
                    {/* Information Banner */}
                    <Animated.View 
                        entering={FadeIn.delay(200)} 
                        style={[styles.infoBanner, { 
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                            borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'
                        }]}
                    >
                        <Icon name="information" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                        <Text style={[styles.infoBannerText, { color: textColor, opacity: 0.8 }]}>
                            💡 <Text style={{ fontWeight: '600' }}>Tip:</Text> Want to share a message with all users? 
                            Ask the admin to publish it as a banner for everyone to see!
                        </Text>
                    </Animated.View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messageList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                </>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10, backgroundColor: headerBg, borderTopColor: borderColor }]}>
                    {replyingTo && (
                        <View style={[styles.replyPreview, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                            <View style={[styles.replyPreviewBar, { backgroundColor: theme.colors.primary }]} />
                            <View style={styles.replyPreviewContent}>
                                <Text style={[styles.replyPreviewTitle, { color: theme.colors.primary }]}>
                                    Replying to {replyingTo.sender_id === user?.id ? 'yourself' : otherUser.full_name}
                                </Text>
                                <Text style={[styles.replyPreviewText, { color: textColor }]} numberOfLines={1}>
                                    {replyingTo.content}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyPreviewClose}>
                                <Icon name="close" size={20} color={subTextColor} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.inputBox, { backgroundColor: isDark ? '#1A1A1A' : '#F1F5F9' }]}>
                        <TextInput
                            style={[styles.input, { color: textColor }]}
                            placeholder="Type a message..."
                            placeholderTextColor={subTextColor}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <View style={styles.inputTools}>
                            <View style={{ flex: 1 }} />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!inputText.trim()}
                                style={[styles.postBtn, { backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.surfaceVariant }]}
                            >
                                <Text style={[styles.postBtnText, { color: inputText.trim() ? '#FFF' : subTextColor }]}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        margin: 16,
        marginBottom: 8,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
        textAlign: 'left',
    },
    navHeader: {
        paddingHorizontal: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    navMain: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navBack: {
        padding: 8,
    },
    navUserInfo: {
        flex: 1,
        marginLeft: 4,
    },
    navTitle: {
        fontSize: 16,
        fontWeight: '900',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    messageRoot: {
        marginLeft: 16,
        marginRight: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 4,
    },
    messageHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    senderAvatar: {
        marginRight: 8,
    },
    senderName: {
        fontSize: 13,
        fontWeight: '800',
    },
    messageBullet: {
        marginHorizontal: 6,
        fontSize: 10,
    },
    messageTime: {
        fontSize: 11,
        fontWeight: '500',
    },
    messageBody: {
        paddingLeft: 8,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    messageActions: {
        flexDirection: 'row',
        marginTop: 8,
        paddingLeft: 4,
    },
    actionIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        padding: 4,
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    inputContainer: {
        padding: 12,
        borderTopWidth: 1,
    },
    inputBox: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    input: {
        fontSize: 15,
        minHeight: 40,
        maxHeight: 120,
    },
    inputTools: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        paddingBottom: 4,
    },
    toolBtn: {
        padding: 8,
        marginRight: 8,
    },
    postBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    postBtnText: {
        fontSize: 14,
        fontWeight: '800',
    },
    replyQuote: {
        marginLeft: 8,
        paddingLeft: 10,
        paddingVertical: 4,
        borderLeftWidth: 2,
        marginBottom: 4,
        borderRadius: 4,
    },
    replyQuoteText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    replyPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: 12,
        position: 'relative',
    },
    replyPreviewBar: {
        width: 4,
        height: '100%',
        borderRadius: 2,
        marginRight: 10,
    },
    replyPreviewContent: {
        flex: 1,
    },
    replyPreviewTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 2,
    },
    replyPreviewText: {
        fontSize: 13,
    },
    replyPreviewClose: {
        padding: 4,
    },
});

export default ChatScreen;
