import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

// Define the User interface based on expected backend response
interface User {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  role: 'student' | 'admin';
  username?: string; // Legacy field
  faculty_id?: number | null;
  program_id?: number | null;
  avatar_url?: string | null;
  banner_url?: string | null;
  faculty?: { id: number; name: string; code?: string };
  program?: { id: number; name: string; code?: string; duration_years?: number };
  current_year?: number;
  current_semester?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean; // For initial app load
  isProcessing: boolean; // For login/register/etc
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const token = await AsyncStorage.getItem('userToken');

      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Refresh full details if missing but IDs present
        resolveFullDetails(parsedUser);
      }
    } catch (error) {
      console.error('AuthContext: Error restoring state', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveFullDetails = async (userObj: User) => {
    let updatedUser = { ...userObj };
    let needsUpdate = false;

    try {
      if (userObj.faculty_id && !userObj.faculty?.code) {
        const faculties = await authService.getFaculties();
        const faculty = faculties.find((f: any) => f.id === userObj.faculty_id);
        if (faculty) {
          updatedUser.faculty = faculty;
          needsUpdate = true;
        }
      }

      if (userObj.program_id && !userObj.program?.duration_years) {
        const programs = await authService.getPrograms(userObj.faculty_id || 0);
        const program = programs.find((p: any) => p.id === userObj.program_id);
        if (program) {
          updatedUser.program = program;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        setUser(updatedUser);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      }
    } catch (e) {
      console.warn('[AuthContext] Failed to resolve full identity details:', e);
    }
  };

  const login = async (email: string, password: string) => {
    setIsProcessing(true);
    try {
      const data = await authService.login(email, password);
      const userObj = data.user;
      if (userObj) {
        setUser(userObj);
        resolveFullDetails(userObj);
      }
    } catch (error: any) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const register = async (userData: any) => {
    setIsProcessing(true);
    try {
      const data = await authService.register(userData);

      // Check if register returned a token for auto-login
      const token = data.access_token || data.token;
      let userObj = data.user;

      if (token) {
        await AsyncStorage.setItem('userToken', token);

        // If user is missing from register response, we might need to fetch profile
        // But let's assume register response is consistent or updated in authService
        if (!userObj) {
          try {
            const { authService } = require('../services/authService'); // Avoid circular if any
            const profileResponse = await authService.getProfile(token);
            userObj = profileResponse;
          } catch (e) {
            console.error('Failed to fetch profile after register', e);
          }
        }

        if (userObj) {
          await AsyncStorage.setItem('userData', JSON.stringify(userObj));
          setUser(userObj);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = async () => {
    setIsProcessing(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('AuthContext: Logout error', error);
    } finally {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
      setIsProcessing(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setIsProcessing(true);
    try {
      await authService.forgotPassword(email);
    } finally {
      setIsProcessing(false);
    }
  };

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const freshUserData = await authService.getProfile(token);
      if (freshUserData) {
        setUser(freshUserData);
        await AsyncStorage.setItem('userData', JSON.stringify(freshUserData));
        resolveFullDetails(freshUserData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isProcessing,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;