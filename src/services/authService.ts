import axiosClient from './api/axiosClient';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
    login: async (email, password) => {
        try {
            const payload = { email, password };
            console.log('[authService] Login payload:', payload);
            // For axios, headers can be set per-request as third argument
            const response = await axiosClient.post(
                API_CONFIG.ENDPOINTS.AUTH.LOGIN,
                payload,
                {
                    onUploadProgress: () => {
                        console.log('[authService] Axios default headers:', axiosClient.defaults.headers);
                    }
                }
            );
            console.log('[authService] Full backend response:', response);
            // If token is present but user is missing, fetch user profile
            let user = response.data.user;
            if (response.data.access_token && !user) {
                console.log('[authService] Token found but user missing, fetching profile...');
                // Manually set header for this subsequence request since interceptor might not pick up AsyncStorage update yet
                // Actually, let's wait for AsyncStorage or just pass header explicitly.
                // Better: Just use the token directly in options.
                try {
                    const profileResponse = await axiosClient.get(API_CONFIG.ENDPOINTS.AUTH.ME, {
                        headers: { Authorization: `Bearer ${response.data.access_token}` }
                    });
                    console.log('[authService] Profile fetched:', profileResponse.data);
                    user = profileResponse.data;
                    // Merge user into response data for consistency
                    response.data.user = user;
                } catch (profileError) {
                    console.error('[authService] Failed to fetch profile:', profileError);
                    throw { message: 'Login successful but failed to load user profile.' };
                }
            }

            if (response.data.access_token) {
                await AsyncStorage.setItem('userToken', response.data.access_token);
            }

            if (user) {
                await AsyncStorage.setItem('userData', JSON.stringify(user));
            } else {
                throw { message: 'Login succeeded but user data missing.' };
            }

            return response.data;
        } catch (error: any) {
            console.log('[authService] Login error object:', error);
            throw error.response?.data || error || { message: 'Network error occurred' };
        }
    },

    register: async (userData: any) => {
        try {
            console.log('[authService] Register payload:', userData);
            // userData should match RegisterRequest: name, email, password, faculty_id, program_id, year, semester
            const response = await axiosClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);
            console.log('[authService] Register Success:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('[authService] Register Error:', error.response?.data || error);
            throw error.response?.data || error || { message: 'Registration failed' };
        }
    },

    logout: async () => {
        try {
            await axiosClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
        } catch (e) {
            // Ignore logout errors
        } finally {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
        }
    },

    forgotPassword: async (email) => {
        try {
            await axiosClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, { email });
        } catch (error) {
            throw error.response?.data || { message: 'Failed to send reset email' };
        }
    },

    getFaculties: async () => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.FACULTIES);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to load faculties' };
        }
    },

    getPrograms: async (facultyId) => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.PROGRAMS, {
                params: { faculty_id: facultyId }
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Failed to load programs' };
        }
    },

    getProfile: async (token?: string) => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.AUTH.ME, token ? {
                headers: { Authorization: `Bearer ${token}` }
            } : {});
            return response.data;
        } catch (error: any) {
            throw error.response?.data || error || { message: 'Failed to fetch profile' };
        }
    }
};
