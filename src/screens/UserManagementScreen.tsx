import React, { useState, useEffect } from 'react';
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
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useTheme, Surface, Searchbar, Menu, FAB, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { authService } from '../services/authService';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

// --- THEME CONSTANTS ---
const COLORS = {
    dark: {
        bg: '#050505',
        card: '#121212',
        border: '#2A2A2A',
        text: '#FFFFFF',
        subtext: '#A1A1AA',
        input: '#1A1A1A',
        accent: '#6366F1', // Indigo
        accentGradient: ['#6366F1', '#8B5CF6'], // Indigo to Purple
        danger: '#EF4444',
        success: '#10B981',
    },
    light: {
        bg: '#F8FAFC',
        card: '#FFFFFF',
        border: '#E2E8F0',
        text: '#0F172A',
        subtext: '#64748B',
        input: '#F1F5F9',
        accent: '#4F46E5', // Indigo
        accentGradient: ['#4F46E5', '#7C3AED'],
        danger: '#EF4444',
        success: '#10B981',
    }
};

const UserManagementScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const isDark = theme.dark;
    const insets = useSafeAreaInsets();
    const colors = isDark ? COLORS.dark : COLORS.light;

    const [users, setUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [selectionMode, setSelectionMode] = useState(false);
    const [filterRole, setFilterRole] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('username');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showFilters, setShowFilters] = useState(false);
    
    // Modals
    const [addUserModalVisible, setAddUserModalVisible] = useState(false);
    const [editUserModalVisible, setEditUserModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [newUser, setNewUser] = useState({
        username: '',
        email: '',
        role: 'student',
        password: '',
    });

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        banned: 0,
        admins: 0,
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await authService.getAllUsers(0, 100);
            setUsers(data);
            
            setStats({
                total: data.length,
                active: data.filter((u: any) => !u.is_banned).length,
                banned: data.filter((u: any) => u.is_banned).length,
                admins: data.filter((u: any) => u.role === 'admin').length,
            });
        } catch (error: any) {
            console.error('[UserManagement] Failed to load users:', error);
            Toast.show({
                type: 'error',
                text1: 'Connection Error',
                text2: 'Could not fetch user database.'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        setSelectionMode(false);
        setSelectedUsers([]);
        loadUsers();
    };

    const handleToggleUserSelection = (userId: number) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(filteredUsers.map(u => u.id));
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedUsers.length === 0) return;

        Alert.alert(
            `${action} Users`,
            `Are you sure you want to ${action.toLowerCase()} ${selectedUsers.length} selected users?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            for (const userId of selectedUsers) {
                                if (action === 'Ban') await authService.banUser(userId);
                                else if (action === 'Delete') await authService.deleteUser(userId);
                            }
                            Toast.show({ type: 'success', text1: 'Bulk Action Complete' });
                            setSelectedUsers([]);
                            setSelectionMode(false);
                            loadUsers();
                        } catch (error: any) {
                            Toast.show({ type: 'error', text1: 'Action Failed' });
                        }
                    }
                }
            ]
        );
    };

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.email || !newUser.password) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all fields.' });
            return;
        }
        try {
            await authService.createUser(newUser);
            Toast.show({ type: 'success', text1: 'User Created' });
            setAddUserModalVisible(false);
            setNewUser({ username: '', email: '', role: 'student', password: '' });
            loadUsers();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Creation Failed', text2: error.message });
        }
    };

    const handleEditUser = async () => {
        if (!selectedUser) return;
        try {
            await authService.updateUser(selectedUser.id, {
                username: selectedUser.username,
                email: selectedUser.email,
                role: selectedUser.role,
            });
            Toast.show({ type: 'success', text1: 'Profile Updated' });
            setEditUserModalVisible(false);
            setSelectedUser(null);
            loadUsers();
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message });
        }
    };

    const handleDeleteUser = (userId: number, username: string) => {
        Alert.alert(
            'Delete User',
            `Permanently delete ${username}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authService.deleteUser(userId);
                            loadUsers();
                        } catch (error) {
                            Toast.show({ type: 'error', text1: 'Delete Failed' });
                        }
                    }
                }
            ]
        );
    };

    const filteredUsers = users
        .filter(user => {
            const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                user.email?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = filterRole === 'all' || user.role === filterRole;
            const matchesStatus = filterStatus === 'all' || 
                                (filterStatus === 'active' && !user.is_banned) ||
                                (filterStatus === 'banned' && user.is_banned);
            return matchesSearch && matchesRole && matchesStatus;
        })
        .sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            return sortOrder === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
        });

    const renderHeader = () => (
        <Animated.View entering={FadeInDown.duration(600)} style={styles.headerContainer}>
            <LinearGradient
                colors={colors.accentGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>Overview</Text>
                        <Text style={styles.headerSubtitle}>User Database</Text>
                    </View>
                    <View style={styles.statRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Users</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.active}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{stats.admins}</Text>
                            <Text style={styles.statLabel}>Admin</Text>
                        </View>
                    </View>
                </View>
                
                {/* Decorative Circles */}
                <View style={styles.headerCircle1} />
                <View style={styles.headerCircle2} />
            </LinearGradient>
        </Animated.View>
    );

    const renderUser = ({ item, index }: { item: any; index: number }) => (
        <Animated.View 
            layout={Layout.springify()} 
            entering={FadeInDown.delay(index * 50).springify()}
            style={{ marginBottom: 12 }}
        >
            <TouchableOpacity
                onPress={() => selectionMode ? handleToggleUserSelection(item.id) : (setSelectedUser(item), setEditUserModalVisible(true))}
                activeOpacity={0.9}
            >
                <View style={[
                    styles.userCard, 
                    { 
                        backgroundColor: colors.card,
                        borderColor: selectedUsers.includes(item.id) ? colors.accent : colors.border
                    }
                ]}>
                    {/* Left: Avatar */}
                    <View style={styles.avatarContainer}>
                        <LinearGradient
                            colors={item.role === 'admin' ? ['#FF416C', '#FF4B2B'] : ['#3B82F6', '#2563EB']}
                            style={styles.avatarGradient}
                        >
                            <Text style={styles.avatarText}>
                                {item.username.charAt(0).toUpperCase()}
                            </Text>
                        </LinearGradient>
                        {item.is_banned && (
                            <View style={[styles.bannedBadge, { backgroundColor: colors.bg }]}>
                                <Icon name="cancel" size={12} color={colors.danger} />
                            </View>
                        )}
                    </View>

                    {/* Middle: Info */}
                    <View style={styles.userInfo}>
                        <View style={styles.nameRow}>
                            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
                                {item.username}
                            </Text>
                            {item.role === 'admin' && (
                                <Icon name="shield-crown" size={14} color="#FF4B2B" style={{ marginLeft: 4 }} />
                            )}
                        </View>
                        <Text style={[styles.email, { color: colors.subtext }]} numberOfLines={1}>
                            {item.email}
                        </Text>
                    </View>

                    {/* Right: Status or Selection */}
                    <View style={styles.actionColumn}>
                        {selectionMode ? (
                            <View style={[
                                styles.checkbox,
                                { 
                                    borderColor: selectedUsers.includes(item.id) ? colors.accent : colors.subtext,
                                    backgroundColor: selectedUsers.includes(item.id) ? colors.accent : 'transparent'
                                }
                            ]}>
                                {selectedUsers.includes(item.id) && <Icon name="check" size={14} color="#FFF" />}
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => {
                                    setMenuVisible({ ...menuVisible, [item.id]: !menuVisible[item.id] });
                                }}
                                style={styles.moreBtn}
                            >
                                <Icon name="dots-horizontal" size={20} color={colors.subtext} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Context Menu (Absolute positioned relative to card logic ideally, but simplified here) */}
                {menuVisible[item.id] && !selectionMode && (
                    <Animated.View entering={FadeInUp.duration(200)} style={[styles.inlineMenu, { backgroundColor: colors.input, borderColor: colors.border }]}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            setMenuVisible({ ...menuVisible, [item.id]: false });
                            handleDeleteUser(item.id, item.username);
                        }}>
                            <Icon name="trash-can-outline" size={18} color={colors.danger} />
                            <Text style={[styles.menuText, { color: colors.danger }]}>Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            setMenuVisible({ ...menuVisible, [item.id]: false });
                            // Toggle ban logic here
                            handleBulkAction('Ban'); // Simplify for demo
                        }}>
                            <Icon name="cancel" size={18} color={colors.text} />
                            <Text style={[styles.menuText, { color: colors.text }]}>{item.is_banned ? 'Unban' : 'Ban'}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );

    const CustomModal = ({ visible, onClose, title, children, actionLabel, onAction }: any) => (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <Animated.View 
                    entering={FadeInUp.springify().damping(15)} 
                    style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="close" size={20} color={colors.subtext} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 400 }}>
                        {children}
                    </ScrollView>

                    <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                        <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                            <Text style={[styles.cancelBtnText, { color: colors.subtext }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={onAction}>
                            <LinearGradient
                                colors={colors.accentGradient}
                                start={{x: 0, y: 0}}
                                end={{x: 1, y: 0}}
                                style={styles.primaryBtn}
                            >
                                <Text style={styles.primaryBtnText}>{actionLabel}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
            
            {/* Top Bar */}
            <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Icon name="arrow-left" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.screenTitle, { color: colors.text }]}>Management</Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn}>
                    <Icon name="refresh" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredUsers}
                renderItem={renderUser}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                ListHeaderComponent={
                    <View>
                        {renderHeader()}
                        
                        <View style={styles.searchContainer}>
                            <View style={[styles.searchBar, { backgroundColor: colors.input, borderColor: colors.border }]}>
                                <Icon name="magnify" size={20} color={colors.subtext} />
                                <TextInput
                                    placeholder="Search users..."
                                    placeholderTextColor={colors.subtext}
                                    style={[styles.searchInput, { color: colors.text }]}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                />
                            </View>
                            <TouchableOpacity 
                                onPress={() => setShowFilters(!showFilters)}
                                style={[styles.filterBtn, { backgroundColor: showFilters ? colors.accent : colors.input }]}
                            >
                                <Icon name="filter-variant" size={20} color={showFilters ? '#FFF' : colors.text} />
                            </TouchableOpacity>
                        </View>

                        {showFilters && (
                            <Animated.View entering={FadeInDown} style={styles.filtersWrapper}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                                    <Chip 
                                        selected={filterRole === 'all'} 
                                        onPress={() => setFilterRole('all')}
                                        style={[styles.chip, { backgroundColor: filterRole === 'all' ? colors.input : 'transparent', borderColor: colors.border, borderWidth: 1 }]}
                                        textStyle={{ color: colors.text }}
                                    >All Roles</Chip>
                                    <Chip 
                                        selected={filterRole === 'admin'} 
                                        onPress={() => setFilterRole('admin')}
                                        style={[styles.chip, { backgroundColor: filterRole === 'admin' ? colors.input : 'transparent', borderColor: colors.border, borderWidth: 1 }]}
                                        textStyle={{ color: colors.text }}
                                    >Admins</Chip>
                                    <Chip 
                                        selected={filterRole === 'student'} 
                                        onPress={() => setFilterRole('student')}
                                        style={[styles.chip, { backgroundColor: filterRole === 'student' ? colors.input : 'transparent', borderColor: colors.border, borderWidth: 1 }]}
                                        textStyle={{ color: colors.text }}
                                    >Students</Chip>
                                    <View style={styles.vDivider} />
                                    <TouchableOpacity onPress={() => setSelectionMode(!selectionMode)}>
                                        <Text style={{ color: colors.accent, fontWeight: '600', marginLeft: 8 }}>
                                            {selectionMode ? 'Cancel Selection' : 'Select Multiple'}
                                        </Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </Animated.View>
                        )}
                        
                        {selectionMode && (
                            <Animated.View entering={FadeInUp} style={[styles.bulkActionBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={{ color: colors.text, fontWeight: '600' }}>{selectedUsers.length} Selected</Text>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <TouchableOpacity onPress={handleSelectAll}>
                                        <Text style={{ color: colors.accent }}>All</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleBulkAction('Delete')}>
                                        <Text style={{ color: colors.danger }}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        )}
                        
                        <Text style={[styles.sectionHeader, { color: colors.subtext }]}>
                            MEMBERS LIST ({filteredUsers.length})
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyState}>
                            <Icon name="account-search-outline" size={60} color={colors.subtext} />
                            <Text style={[styles.emptyText, { color: colors.subtext }]}>No users found</Text>
                        </View>
                    ) : null
                }
            />

            {!selectionMode && (
                <FAB
                    icon="plus"
                    color="#FFF"
                    style={[styles.fab, { backgroundColor: 'transparent' }]}
                    onPress={() => setAddUserModalVisible(true)}
                    // Custom rendering for gradient FAB
                    renderInPortal={false}
                    customSize={56}
                />
            )}
            {!selectionMode && (
                // This is a workaround to apply gradient to FAB since Paper FAB doesn't support it directly nicely
                 <TouchableOpacity 
                    style={[styles.fabContainer]} 
                    onPress={() => setAddUserModalVisible(true)}
                    activeOpacity={0.8}
                 >
                    <LinearGradient
                        colors={colors.accentGradient}
                        style={styles.fabGradient}
                    >
                        <Icon name="plus" size={28} color="#FFF" />
                    </LinearGradient>
                 </TouchableOpacity>
            )}

            {/* Add User Modal */}
            <CustomModal
                visible={addUserModalVisible}
                onClose={() => setAddUserModalVisible(false)}
                title="New User"
                actionLabel="Create Account"
                onAction={handleAddUser}
            >
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.subtext }]}>USERNAME</Text>
                    <TextInput 
                        style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                        placeholder="Ex: JohnDoe"
                        placeholderTextColor={colors.subtext}
                        value={newUser.username}
                        onChangeText={t => setNewUser({...newUser, username: t})}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.subtext }]}>EMAIL ADDRESS</Text>
                    <TextInput 
                        style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                        placeholder="john@example.com"
                        placeholderTextColor={colors.subtext}
                        keyboardType="email-address"
                        value={newUser.email}
                        onChangeText={t => setNewUser({...newUser, email: t})}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.subtext }]}>PASSWORD</Text>
                    <TextInput 
                        style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                        placeholder="••••••••"
                        placeholderTextColor={colors.subtext}
                        secureTextEntry
                        value={newUser.password}
                        onChangeText={t => setNewUser({...newUser, password: t})}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.subtext }]}>ROLE</Text>
                    <View style={styles.roleRow}>
                        {['student', 'admin'].map(r => (
                            <TouchableOpacity 
                                key={r}
                                onPress={() => setNewUser({...newUser, role: r})}
                                style={[
                                    styles.roleOption, 
                                    { 
                                        borderColor: newUser.role === r ? colors.accent : colors.border,
                                        backgroundColor: newUser.role === r ? colors.input : 'transparent'
                                    }
                                ]}
                            >
                                <Text style={{ color: newUser.role === r ? colors.accent : colors.subtext, fontWeight: '600' }}>
                                    {r.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </CustomModal>

            {/* Edit User Modal */}
            <CustomModal
                visible={editUserModalVisible}
                onClose={() => setEditUserModalVisible(false)}
                title="Edit Profile"
                actionLabel="Save Changes"
                onAction={handleEditUser}
            >
                {selectedUser && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.subtext }]}>USERNAME</Text>
                            <TextInput 
                                style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                                value={selectedUser.username}
                                onChangeText={t => setSelectedUser({...selectedUser, username: t})}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.subtext }]}>EMAIL</Text>
                            <TextInput 
                                style={[styles.modalInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                                value={selectedUser.email}
                                onChangeText={t => setSelectedUser({...selectedUser, email: t})}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.subtext }]}>ROLE</Text>
                            <View style={styles.roleRow}>
                                {['student', 'admin'].map(r => (
                                    <TouchableOpacity 
                                        key={r}
                                        onPress={() => setSelectedUser({...selectedUser, role: r})}
                                        style={[
                                            styles.roleOption, 
                                            { 
                                                borderColor: selectedUser.role === r ? colors.accent : colors.border,
                                                backgroundColor: selectedUser.role === r ? colors.input : 'transparent'
                                            }
                                        ]}
                                    >
                                        <Text style={{ color: selectedUser.role === r ? colors.accent : colors.subtext, fontWeight: '600' }}>
                                            {r.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}
            </CustomModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    iconBtn: { padding: 8, borderRadius: 20 },
    screenTitle: { fontSize: 18, fontWeight: '700', letterSpacing: 0.5 },
    
    // Header
    headerContainer: {
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    headerGradient: {
        padding: 24,
        position: 'relative',
    },
    headerContent: { zIndex: 10 },
    headerTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.7)',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFF',
        marginTop: 4,
        letterSpacing: -0.5,
    },
    statRow: {
        flexDirection: 'row',
        marginTop: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statItem: { alignItems: 'flex-start' },
    statNumber: { fontSize: 22, fontWeight: '700', color: '#FFF' },
    statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 2 },
    divider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
    
    // Decorative circles
    headerCircle1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerCircle2: {
        position: 'absolute',
        bottom: -40,
        right: 40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    // Search & Filter
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginTop: 12,
    },
    searchBar: {
        flex: 1,
        height: 50,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
    filterBtn: {
        width: 50,
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filtersWrapper: { marginTop: 16, paddingLeft: 20 },
    chipsScroll: { alignItems: 'center', paddingRight: 20 },
    chip: { marginRight: 8, height: 32 },
    vDivider: { width: 1, height: 20, backgroundColor: '#333', marginHorizontal: 8 },
    
    // List
    sectionHeader: {
        marginHorizontal: 24,
        marginTop: 24,
        marginBottom: 12,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    listContent: { paddingHorizontal: 20 },
    
    // User Card
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    avatarContainer: { position: 'relative' },
    avatarGradient: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    bannedBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    userInfo: { flex: 1, marginLeft: 16 },
    nameRow: { flexDirection: 'row', alignItems: 'center' },
    username: { fontSize: 16, fontWeight: '700' },
    email: { fontSize: 13, marginTop: 2 },
    actionColumn: { justifyContent: 'center', alignItems: 'flex-end' },
    moreBtn: { padding: 8 },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    // Inline Menu
    inlineMenu: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    menuText: { fontSize: 13, fontWeight: '600' },

    // Bulk Action Bar
    bulkActionBar: {
        marginHorizontal: 20,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },

    // FAB
    fab: { display: 'none' }, // Hiding paper FAB to use custom
    fabContainer: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Empty State
    emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
    emptyText: { marginTop: 16, fontSize: 16, fontWeight: '500' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    closeBtn: { padding: 4 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
    modalInput: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        borderWidth: 1,
    },
    roleRow: { flexDirection: 'row', gap: 12 },
    roleOption: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 20,
        borderTopWidth: 1,
        gap: 16,
    },
    cancelBtn: { paddingVertical: 10 },
    cancelBtnText: { fontWeight: '600' },
    primaryBtn: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    primaryBtnText: { color: '#FFF', fontWeight: '700' },
});

export default UserManagementScreen;