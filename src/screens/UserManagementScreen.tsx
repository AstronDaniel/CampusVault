import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    Dimensions,
    Alert
} from 'react-native';
import { useTheme, Surface, Searchbar, Menu, Button } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const UserManagementScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;

    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await authService.getAllUsers(0, 100);
            setUsers(data);
        } catch (error: any) {
            console.error('[UserManagement] Failed to load users:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to Load Users',
                text2: error.message || 'Could not fetch users'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadUsers();
    };

    const handleBanUser = (userId: number, username: string) => {
        Alert.alert(
            'Ban User',
            `Are you sure you want to ban ${username}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Ban',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.banUser(userId);
                            Toast.show({
                                type: 'success',
                                text1: 'User Banned',
                                text2: `${username} has been banned`
                            });
                            loadUsers();
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Ban Failed',
                                text2: error.message || 'Could not ban user'
                            });
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteUser = (userId: number, username: string) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to permanently delete ${username}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.deleteUser(userId);
                            Toast.show({
                                type: 'success',
                                text1: 'User Deleted',
                                text2: `${username} has been deleted`
                            });
                            loadUsers();
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: 'Delete Failed',
                                text2: error.message || 'Could not delete user'
                            });
                        }
                    }
                }
            ]
        );
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderUser = ({ item, index }: { item: any; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index % 10 * 30)}>
            <Surface
                style={[
                    styles.userCard,
                    { backgroundColor: isDark ? theme.colors.surface : '#FFF' }
                ]}
                elevation={1}
            >
                <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
                            {item.username?.substring(0, 2).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={[styles.username, { color: isDark ? '#FFF' : '#1E293B' }]}>
                            {item.username}
                        </Text>
                        <Text style={[styles.email, { color: theme.colors.outline }]}>
                            {item.email}
                        </Text>
                        <View style={styles.badges}>
                            <View style={[styles.roleBadge, { backgroundColor: item.role === 'admin' ? '#EF4444' : '#3B82F6' }]}>
                                <Text style={styles.roleBadgeText}>{item.role?.toUpperCase()}</Text>
                            </View>
                            {item.is_verified && (
                                <Icon name="check-decagram" size={16} color="#10B981" style={{ marginLeft: 8 }} />
                            )}
                        </View>
                    </View>
                </View>

                <Menu
                    visible={menuVisible[item.id] || false}
                    onDismiss={() => setMenuVisible({ ...menuVisible, [item.id]: false })}
                    anchor={
                        <TouchableOpacity
                            onPress={() => setMenuVisible({ ...menuVisible, [item.id]: true })}
                            style={styles.menuButton}
                        >
                            <Icon name="dots-vertical" size={24} color={theme.colors.outline} />
                        </TouchableOpacity>
                    }
                >
                    <Menu.Item
                        onPress={() => {
                            setMenuVisible({ ...menuVisible, [item.id]: false });
                            handleBanUser(item.id, item.username);
                        }}
                        title="Ban User"
                        leadingIcon="cancel"
                    />
                    <Menu.Item
                        onPress={() => {
                            setMenuVisible({ ...menuVisible, [item.id]: false });
                            handleDeleteUser(item.id, item.username);
                        }}
                        title="Delete User"
                        leadingIcon="delete"
                    />
                </Menu>
            </Surface>
        </Animated.View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={isDark ? ['#1A1A1A', '#111111'] : ['#1E1B4B', '#312E81']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Icon name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>User Management</Text>
                        <Text style={styles.headerSubtitle}>{users.length} total users</Text>
                    </View>
                </View>

                <Searchbar
                    placeholder="Search users..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                    inputStyle={{ fontSize: 14, color: '#FFF' }}
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    iconColor="rgba(255,255,255,0.5)"
                />
            </LinearGradient>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUser}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="account-off-outline" size={64} color={theme.colors.outline} />
                            <Text style={[styles.emptyText, { color: theme.colors.outline }]}>
                                No users found
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
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backBtn: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '500',
    },
    searchBar: {
        borderRadius: 12,
        height: 44,
        elevation: 0,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '700',
    },
    userDetails: {
        marginLeft: 12,
        flex: 1,
    },
    username: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    email: {
        fontSize: 13,
        marginBottom: 4,
    },
    badges: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    roleBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    menuButton: {
        padding: 8,
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

export default UserManagementScreen;
