  
import axiosClient from './api/axiosClient';
import { API_CONFIG } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
    login: async (email: string, password: string) => {
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

    forgotPassword: async (email: string) => {
        try {
            await axiosClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, { email });
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to send reset email' };
        }
    },

    getFaculties: async () => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.FACULTIES);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to load faculties' };
        }
    },

    getPrograms: async (facultyId: number) => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.PROGRAMS, {
                params: { faculty_id: facultyId }
            });
            return response.data;
        } catch (error: any) {
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
    },

    getUserStats: async () => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.AUTH.STATS);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to fetch stats' };
        }
    },

    getCourseUnits: async (programId?: number, year?: number, semester?: number) => {
        const cacheKey = `course_units_${programId}_${year || 'all'}_${semester || 'all'}`;
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.COURSE_UNITS, {
                params: {
                    ...(programId && programId > 0 ? { program_id: programId } : {}),
                    ...(year && { year }),
                    ...(semester && { semester })
                }
            });
            // Cache the data for offline use
            await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
            return response.data;
        } catch (error: any) {
            console.warn('[authService] Failed to fetch course units, checking cache...', error);
            const cachedData = await AsyncStorage.getItem(cacheKey);
            if (cachedData) {
                console.log('[authService] Returning cached course units.');
                return JSON.parse(cachedData);
            }
            throw error.response?.data || error || { message: 'Failed to fetch course units' };
        }
    },

    checkDuplicate: async (
        course_unit_id: number,
        file: { uri: string; name: string; type?: string; size?: number },
        onUploadProgress?: (progressEvent: any) => void
    ) => {
        try {
            const form = new FormData();
            form.append('course_unit_id', String(course_unit_id));
            form.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.type || 'application/octet-stream',
            } as any);

            const response = await axiosClient.post(
                `${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/check-duplicate`,
                form,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress,
                }
            );
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to check duplicate' };
        }
    },

    getSearchAutocomplete: async (query: string) => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.SEARCH_AUTOCOMPLETE, {
                params: { q: query }
            });
            return response.data;
        } catch (error: any) {
            // Handle FastAPI 404 "detail: Not found" by returning empty suggestions
            if (error.response?.status === 404 || error.detail === 'Not found') {
                return [];
            }
            throw error.response?.data || error || { message: 'Failed to fetch autocomplete suggestions' };
        }
    },

    searchProgramUnits: async (programId: number, query: string) => {
        const cacheKey = `search_program_${programId}_${query}`;
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.COURSE_UNITS, {
                params: {
                    program_id: programId,
                    search: query
                }
            });
            await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
            return response.data;
        } catch (error: any) {
            const cached = await AsyncStorage.getItem(cacheKey);
            if (cached) return JSON.parse(cached);
            throw error;
        }
    },

    getResources: async (courseUnitId: number, type?: string) => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.RESOURCES, {
                params: {
                    course_unit_id: courseUnitId,
                    resource_type: type
                }
            });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to fetch resources' };
        }
    },

    getResourceById: async (id: number) => {
        try {
            const response = await axiosClient.get(`${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/${id}`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to fetch resource details' };
        }
    },

    uploadResource: async (
        course_unit_id: number,
        file: { uri: string; name: string; type?: string; size?: number },
        title?: string | null,
        description?: string | null,
        resource_type: string = 'notes',
        onUploadProgress?: (progressEvent: any) => void
    ) => {
        try {
            const form = new FormData();
            form.append('course_unit_id', String(course_unit_id));
            if (title) form.append('title', String(title));
            if (description) form.append('description', String(description));
            form.append('resource_type', resource_type);

            // RN file object
            form.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.type || 'application/octet-stream',
            } as any);

            const response = await axiosClient.post(
                `${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/upload`,
                form,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    onUploadProgress,
                }
            );
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to upload resource' };
        }
    },

    getBookmarks: async () => {
        try {
            const response = await axiosClient.get(API_CONFIG.ENDPOINTS.DATA.BOOKMARKS);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to fetch bookmarks' };
        }
    },

    bookmarkResource: async (id: number) => {
        try {
            await axiosClient.post(`${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/${id}/bookmark`);
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to bookmark' };
        }
    },

    unbookmarkResource: async (id: number) => {
        try {
            await axiosClient.delete(`${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/${id}/bookmark`);
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to remove bookmark' };
        }
    },

    recordDownload: async (id: number) => {
        try {
            const response = await axiosClient.post(`${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/${id}/download`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to record download' };
        }
    },

    getComments: async (id: number) => {
        try {
            const response = await axiosClient.get(`${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/${id}/comments`);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to fetch comments' };
        }
    },

    addComment: async (id: number, content: string) => {
        try {
            // Backend expects the comment text under the `body` field
            const response = await axiosClient.post(
                `${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/${id}/comments`,
                { body: content }
            );
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to add comment' };
        }
    },

    rateResource: async (id: number, rating: number) => {
        try {
            const response = await axiosClient.post(`${API_CONFIG.ENDPOINTS.DATA.RESOURCES}/${id}/rating`, { rating });
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Failed to submit rating' };
        }
    },
    getResourceCount: async (courseUnitId: number, type?: string) => {
        console.log('[authService] getResourceCount called with:', { courseUnitId, type });
        if (typeof courseUnitId !== 'number' || isNaN(courseUnitId) || courseUnitId <= 0) {
            console.error('[authService] Invalid courseUnitId for resource count:', courseUnitId);
            throw { message: 'Invalid courseUnitId for resource count' };
        }
        try {
            const response = await axiosClient.get('/resources/count', {
                params: {
                    course_unit_id: courseUnitId,
                    resource_type: type
                }
            });
            console.log('[authService] Resource count response:', response.data);
            return response.data.count;
        } catch (error: any) {
            console.error('[authService] Failed to fetch resource count:', error);
            throw error.response?.data || { message: 'Failed to fetch resource count' };
        }
    },
};
