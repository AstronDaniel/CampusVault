import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

// Define the User interface based on expected backend response
interface User {
  id: number;
  email: string;
  name: string;
  faculty_id?: number | null;
  program_id?: number | null;
  avatar?: string | null;
  // Add other user fields as needed
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
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('AuthContext: Error restoring state', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsProcessing(true);
    try {
      const data = await authService.login(email, password);
      const userObj = data.user;
      if (userObj) {
        setUser(userObj);
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

  const value: AuthContextType = {
    user,
    isLoading,
    isProcessing,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;