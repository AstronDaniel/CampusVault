import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Realtime } from 'ably';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    Dimensions
} from 'react-native';
import { useTheme, Surface, Avatar, Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const AdminChatListScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;
    const { user } = useAuth();
    const ably = useRef<Realtime | null>(null);

    const [conversations, setConversations] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

    // Pagination state
    const [skip, setSkip] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const LIMIT = 20;

    const loadConversations = useCallback(async (reset = false) => {
        if (!reset && (loadingMore || !hasMore)) return;

        if (reset) {
            setLoading(true);
            setSkip(0);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentSkip = reset ? 0 : skip;
            const data = await authService.getChatConversations(
                currentSkip,
                LIMIT,
                activeTab === 'unread'
            );

            if (reset) {
                setConversations(data);
            } else {
                setConversations(prev => [...prev, ...data]);
            }

            setSkip(currentSkip + LIMIT);
            if (data.length < LIMIT) {
                setHasMore(false);
            }
        } catch (error) {
            console.error('[AdminChatList] Failed to load conversations:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [skip, hasMore, loadingMore, activeTab]);

    useFocusEffect(
        useCallback(() => {
            loadConversations(true);
        }, [activeTab])
    );

    useEffect(() => {
        if (!user?.id) return;

        const setupAbly = async () => {
            try {
                const tokenRequest = await authService.getAblyToken();
                const realtime = new Realtime({
                    authCallback: (params, callback) => {
                        callback(null, tokenRequest);
                    }
                });
                ably.current = realtime;

                const userChannel = realtime.channels.get(`user-${user.id}`);

                userChannel.subscribe('message', (message) => {
                    const data = message.data;
                    if (data.sender_id !== user.id) {
                        setConversations(prev => {
                            const existing = prev.find(c => c.user_id === data.sender_id);
                            if (existing) {
                                return [
                                    { ...existing, last_message: data.content, last_timestamp: data.timestamp, unread_count: (existing.unread_count || 0) + 1 },
                                    ...prev.filter(c => c.user_id !== data.sender_id)
                                ];
                            }
                            return prev;
                        });
                    }
                });

                userChannel.subscribe('read_sync', (message) => {
                    const { other_user_id } = message.data;
                    setConversations(prev => prev.map(c =>
                        c.user_id === other_user_id ? { ...c, unread_count: 0 } : c
                    ));
                });

            } catch (error) {
                console.error('[AdminChatList] Ably setup failed:', error);
            }
        };

        setupAbly();

        return () => {
            if (ably.current) {
                ably.current.close();
                ably.current = null;
            }
        };
    }, [user?.id]);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        // For search, we might want a different logic or just filter locally if small,
        // but for 1000s we should use a search API.
        // For now, local filtering on the current loaded set, but ideally we'd hit /search
    };

    const filteredConversations = conversations.filter(c =>
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatTime = (timestamp: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index % 10 * 50)}>
            <TouchableOpacity
                style={[
                    styles.conversationItem,
                    {
                        backgroundColor: isDark ? theme.colors.surface : '#FFFFFF',
                        borderColor: isDark ? theme.colors.surfaceVariant : '#E2E8F0',
                        borderWidth: 1
                    }
                ]}
                onPress={() => navigation.navigate('ProfessionalChat', {
                    otherUser: {
                        id: item.user_id,
                        full_name: item.full_name,
                        avatar_url: item.avatar_url,
                        role: 'student'
                    }
                })}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    {item.avatar_url ? (
                        <Avatar.Image size={50} source={{ uri: item.avatar_url }} />
                    ) : (
                        <Avatar.Text
                            size={50}
                            label={item.full_name?.substring(0, 2).toUpperCase() || 'U'}
                            style={{ backgroundColor: isDark ? theme.colors.surfaceVariant : theme.colors.primaryContainer }}
                            labelStyle={{ color: isDark ? '#FFF' : theme.colors.primary }}
                        />
                    )}
                    {item.unread_count > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: '#EF4444' }]}>
                            <Text style={styles.unreadText}>{item.unread_count > 9 ? '9+' : item.unread_count}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                        <Text
                            style={[
                                styles.userName,
                                { color: isDark ? '#FFFFFF' : '#1E293B' },
                                item.unread_count > 0 && { fontWeight: '900' }
                            ]}
                            numberOfLines={1}
                        >
                            {item.full_name}
                        </Text>
                        <Text style={[styles.timestamp, { color: item.unread_count > 0 ? theme.colors.primary : theme.colors.outline }]}>
                            {formatTime(item.last_timestamp)}
                        </Text>
                    </View>
                    <Text
                        style={[
                            styles.lastMessage,
                            { color: item.unread_count > 0 ? (isDark ? '#E5E7EB' : '#111827') : theme.colors.outline },
                            item.unread_count > 0 && { fontWeight: '700' }
                        ]}
                        numberOfLines={1}
                    >
                        {item.last_message || 'No messages yet'}
                    </Text>
                </View>

                {item.unread_count > 0 && <View style={styles.unreadDot} />}
                <Icon name="chevron-right" size={20} color={theme.colors.outlineVariant} />
            </TouchableOpacity>
        </Animated.View >
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle="light-content" />

            <View style={[styles.header, { backgroundColor: isDark ? theme.colors.surface : '#4F46E5', borderBottomColor: isDark ? theme.colors.surfaceVariant : 'transparent', borderBottomWidth: isDark ? 1 : 0 }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Student Support</Text>
                    <View style={{ width: 40 }} />
                </View>

                <Searchbar
                    placeholder="Search name..."
                    onChangeText={handleSearch}
                    value={searchQuery}
                    style={[styles.searchBar, { backgroundColor: isDark ? theme.colors.surfaceVariant : 'rgba(255,255,255,0.15)', borderColor: isDark ? theme.colors.surfaceVariant : 'transparent', borderWidth: 1 }]}
                    inputStyle={{ fontSize: 14, color: '#FFF' }}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    iconColor="rgba(255,255,255,0.5)"
                />

                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('all')}
                        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Chats</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('unread')}
                        style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
                    >
                        <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>Unread</Text>
                        {conversations.some(c => c.unread_count > 0) && <View style={styles.tabBadge} />}
                    </TouchableOpacity>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    renderItem={renderItem}
                    keyExtractor={item => item.user_id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => loadConversations()}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); loadConversations(true); }}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListFooterComponent={loadingMore ? <ActivityIndicator style={{ margin: 20 }} color={theme.colors.primary} /> : null}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="message-off-outline" size={64} color={isDark ? '#1A1A1A' : '#CBD5E1'} />
                            <Text style={[styles.emptyText, { color: isDark ? '#A1A1AA' : '#1E293B' }]}>
                                {activeTab === 'unread' ? 'No unread messages' : 'No active conversations'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 60,
        paddingBottom: 0, // adjusted for tabs
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    searchBar: {
        borderRadius: 12,
        height: 44,
        elevation: 0,
        marginBottom: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 20,
        paddingBottom: 4,
    },
    tab: {
        paddingVertical: 10,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#FFFFFF',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.6)',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    tabBadge: {
        position: 'absolute',
        top: 8,
        right: -10,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    conversationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    unreadBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#0A0A0A',
    },
    unreadText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginHorizontal: 8,
    },
    conversationContent: {
        flex: 1,
        marginLeft: 12,
        gap: 2,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
    },
    timestamp: {
        fontSize: 11,
        fontWeight: '600',
    },
    lastMessage: {
        fontSize: 13,
        lineHeight: 18,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 12,
    },
});

export default AdminChatListScreen;
