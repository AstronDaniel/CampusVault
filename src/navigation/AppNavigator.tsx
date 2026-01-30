import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';

import SplashScreen from '../screens/ModernSplashScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import UploadScreen from '../screens/UploadScreen';
import BookmarkScreen from '../screens/BookmarkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangeProfileScreen from '../screens/ChangeProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import MyResourcesScreen from '../screens/MyResourcesScreen';
import SettingsScreen from '../screens/SettingsScreen';

import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/EnhancedOnboardingScreen';
import CourseDetailsScreen from '../screens/CourseDetailsScreen';
import ResourceDetailsScreen from '../screens/ResourceDetailsScreen';
import DocumentPreviewScreen from '../screens/DocumentPreviewScreen';
import FacultyDetailScreen from '../screens/FacultyDetailScreen';
import ProgramDetailScreen from '../screens/ProgramDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import AdminChatListScreen from '../screens/AdminChatListScreen';
import ProfessionalChatScreen from '../screens/ProfessionalChatScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import { useAuth } from '../context/AuthContext';

const MainTabs = () => {
    const theme = useTheme();
    const isDark = theme.dark;
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Explore') iconName = focused ? 'compass' : 'compass-outline';
                    else if (route.name === 'Upload') iconName = focused ? 'plus-circle' : 'plus-circle-outline';
                    else if (route.name === 'Bookmarks') iconName = focused ? 'bookmark' : 'bookmark-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'account' : 'account-outline';
                    return <Icon name={iconName || 'help'} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.outline,
                tabBarStyle: {
                    backgroundColor: isDark ? theme.colors.surface : '#fff',
                    borderTopWidth: isDark ? 1 : 0,
                    borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'transparent',
                    elevation: isDark ? 0 : 10,
                    height: 65,
                    paddingBottom: 12,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                }
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Explore" component={ExploreScreen} />
            <Tab.Screen name="Upload" component={UploadScreen} />
            <Tab.Screen name="Bookmarks" component={BookmarkScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const hasSeen = await AsyncStorage.getItem('hasSeenOnboarding');
                setIsFirstLaunch(hasSeen !== 'true');
            } catch (e) {
                setIsFirstLaunch(false);
            }
        };
        checkOnboarding();
    }, []);

    if (isLoading || isFirstLaunch === null) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                <ActivityIndicator size="large" color="#EC4899" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
                // Authenticated Stack with Tabs
                <>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
                    <Stack.Screen name="ResourceDetails" component={ResourceDetailsScreen} />
                    <Stack.Screen name="DocumentPreview" component={DocumentPreviewScreen} />
                    <Stack.Screen name="FacultyDetail" component={FacultyDetailScreen} />
                    <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
                    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                    <Stack.Screen name="ChangeProfile" component={ChangeProfileScreen} />
                    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    <Stack.Screen name="MyResources" component={MyResourcesScreen} />
                    <Stack.Screen name="Settings" component={SettingsScreen} />
                    <Stack.Screen name="Chat" component={ChatScreen} />
                    <Stack.Screen name="AdminChatList" component={AdminChatListScreen} />
                    <Stack.Screen name="ProfessionalChat" component={ProfessionalChatScreen} />
                    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                </>
            ) : (
                // Non-Authenticated Stack
                <>
                    {isFirstLaunch && (
                        <Stack.Screen name="Onboarding">
                            {(props) => (
                                <OnboardingScreen
                                    {...props}
                                    onComplete={() => {
                                        AsyncStorage.setItem('hasSeenOnboarding', 'true');
                                        setIsFirstLaunch(false);
                                    }}
                                />
                            )}
                        </Stack.Screen>
                    )}
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="ResetPassword" component={require('../screens/ResetPasswordScreen').default} />
                </>
            )}
        </Stack.Navigator>
    );
};

export default AppNavigator;
