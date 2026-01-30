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
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Realtime } from 'ably';
import { API_CONFIG } from '../config/api';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const ChatScreen = ({ route, navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { otherUser } = route.params || {}; // expect { id: number, full_name: string }

    const [messages, setMessages] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');
    const ably = useRef<Realtime | null>(null);
    const channel = useRef<any>(null);
    const flatListRef = useRef<FlatList>(null);

    const WS_BASE = API_CONFIG.BASE_URL.replace(/^http/, 'ws');

    // Fetch History
    useEffect(() => {
        if (!otherUser?.id) return;

        const fetchHistory = async () => {
            try {
                const history = await authService.getChatHistory(otherUser.id);
                setMessages(history);
            } catch (error) {
                console.error('Failed to fetch chat history:', error);
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
            console.log('[Chat] Initializing Ably...');

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
                console.log('[Chat] Ably Connected');
                setConnectionStatus('connected');
            });

            realtime.connection.on('disconnected', () => {
                console.log('[Chat] Ably Disconnected');
                setConnectionStatus('disconnected');
            });

            realtime.connection.on('failed', () => {
                console.error('[Chat] Ably Connection Failed');
                setConnectionStatus('error');
            });

            // Subscribe to user-specific channel
            const userChannel = realtime.channels.get(`user-${user.id}`);
            channel.current = userChannel;

            userChannel.subscribe('message', (message) => {
                const data = message.data;
                console.log('[Chat] Received message via Ably:', data);

                // Only add message if it's part of this conversation
                if (
                    (data.sender_id === otherUser?.id && data.receiver_id === user?.id) ||
                    (data.sender_id === user?.id && data.receiver_id === otherUser?.id)
                ) {
                    setMessages((prev) => {
                        // Avoid duplicates (since we publish to both channels)
                        if (prev.some(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                }
            });

        } catch (error) {
            console.error('[Chat] Ably setup error:', error);
            setConnectionStatus('error');
        }
    }, [otherUser?.id, user?.id]);

    // Ably Connection Lifecycle
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
        setInputText('');
        Keyboard.dismiss();

        try {
            // Use REST API for sending to ensure persistence and persistence-to-Ably flow
            const savedMsg = await authService.sendMessage(otherUser.id, content);
            console.log('[Chat] Message sent and saved:', savedMsg);

            // Note: Ably subscription will handle adding the message to UI for us 
            // but we can also add it immediately for better UX if it's not already there
            setMessages((prev) => {
                if (prev.some(m => m.id === savedMsg.id)) return prev;
                return [...prev, savedMsg];
            });
        } catch (e) {
            console.error('[Chat] Failed to send message:', e);
            // Optionally restore input text on failure
            setInputText(content);
        }
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.sender_id === user?.id;
        return (
            <View style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.otherMessage,
                { backgroundColor: isMe ? theme.colors.primary : theme.colors.surfaceVariant }
            ]}>
                <Text style={[styles.messageText, { color: isMe ? 'white' : theme.colors.onSurfaceVariant }]}>
                    {item.content}
                </Text>
                <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.outline, textAlign: isMe ? 'right' : 'left' }]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Icon name="chevron-left" size={30} color={theme.colors.onSurface} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                        {otherUser?.full_name || 'Chat'}
                    </Text>
                    <View style={styles.statusRow}>
                        <View style={[
                            styles.statusDot,
                            { backgroundColor: connectionStatus === 'connected' ? '#4ADE80' : connectionStatus === 'connecting' ? '#FBBF24' : '#EF4444' }
                        ]} />
                        <Text style={[styles.onlineStatus, { color: theme.colors.outline }]}>
                            {connectionStatus === 'connected' ? 'Online' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                        </Text>
                    </View>
                </View>
            </View>

            {isLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator color={theme.colors.primary} size="large" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10, backgroundColor: theme.colors.surface }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.onSurface }]}
                        placeholder="Type a message..."
                        placeholderTextColor={theme.colors.outline}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={!inputText.trim()}
                        style={[styles.sendButton, { backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.surfaceVariant }]}
                    >
                        <Icon name="send" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingBottom: 15,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: { padding: 5 },
    headerTitleContainer: { marginLeft: 10 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    onlineStatus: { fontSize: 12 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageList: { padding: 15, paddingBottom: 30 },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 10,
    },
    myMessage: {
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: { fontSize: 15 },
    timestamp: { fontSize: 10, marginTop: 4 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    input: {
        flex: 1,
        borderRadius: 25,
        paddingHorizontal: 20,
        paddingVertical: 10,
        maxHeight: 100,
        marginRight: 10,
    },
    sendButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;
