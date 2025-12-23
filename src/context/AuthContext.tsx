import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User, LoginRequest, RegisterRequest } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.data) {
        const { user: userData, token, refreshToken } = response.data;
        
        // Store auth data
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        
        setUser(userData);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    
    try {
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        const { user: newUser, token, refreshToken } = response.data;
        
        // Store auth data
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        
        setUser(newUser);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      // Still clear local state even if API call fails
      setUser(null);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    const response = await apiService.forgotPassword(email);
    
    if (!response.success) {
      throw new Error(response.error || 'Password reset failed');
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;