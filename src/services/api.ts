import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API configuration
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3000/api' // Android emulator localhost
  : 'https://your-production-api.com/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  name: string;
  email: string;
  faculty: string;
  program: string;
  password: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  faculty: string;
  program: string;
  avatar?: string;
  role: 'student' | 'faculty' | 'admin';
  createdAt: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'note' | 'assignment' | 'document' | 'video';
  faculty: string;
  program: string;
  courseUnit: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  uploadedBy: User;
  uploadedAt: string;
  downloads: number;
  rating: number;
  tags: string[];
}

class ApiService {
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const config: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    // For demo purposes, simulate API call with mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        if (credentials.email && credentials.password) {
          const mockUser: User = {
            id: '1',
            name: 'John Doe',
            email: credentials.email,
            faculty: 'Faculty of Engineering',
            program: 'Computer Science',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            role: 'student',
            createdAt: new Date().toISOString(),
          };

          const mockResponse: AuthResponse = {
            user: mockUser,
            token: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
          };

          resolve({
            success: true,
            data: mockResponse,
            message: 'Login successful',
          });
        } else {
          resolve({
            success: false,
            error: 'Invalid credentials',
          });
        }
      }, 1500);
    });

    // Uncomment for real API call:
    // return this.makeRequest<AuthResponse>('/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify(credentials),
    // });
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    // For demo purposes, simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: User = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          faculty: userData.faculty,
          program: userData.program,
          role: 'student',
          createdAt: new Date().toISOString(),
        };

        const mockResponse: AuthResponse = {
          user: mockUser,
          token: 'mock-jwt-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
        };

        resolve({
          success: true,
          data: mockResponse,
          message: 'Registration successful',
        });
      }, 2000);
    });

    // Uncomment for real API call:
    // return this.makeRequest<AuthResponse>('/auth/register', {
    //   method: 'POST',
    //   body: JSON.stringify(userData),
    // });
  }

  async forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    // For demo purposes, simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: { message: 'Password reset email sent' },
          message: 'Password reset email sent successfully',
        });
      }, 1500);
    });

    // Uncomment for real API call:
    // return this.makeRequest<{ message: string }>('/auth/forgot-password', {
    //   method: 'POST',
    //   body: JSON.stringify({ email }),
    // });
  }

  async logout(): Promise<ApiResponse<{ message: string }>> {
    try {
      await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'user']);
      return {
        success: true,
        data: { message: 'Logged out successfully' },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Logout failed',
      };
    }
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/user/profile');
  }

  async updateProfile(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  // Resources endpoints
  async getResources(params?: {
    faculty?: string;
    program?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ resources: Resource[]; total: number; page: number }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    return this.makeRequest<{ resources: Resource[]; total: number; page: number }>(
      `/resources?${queryParams.toString()}`
    );
  }

  async getResourceById(id: string): Promise<ApiResponse<Resource>> {
    return this.makeRequest<Resource>(`/resources/${id}`);
  }

  async uploadResource(resourceData: FormData): Promise<ApiResponse<Resource>> {
    const token = await this.getAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/resources/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: resourceData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  async deleteResource(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.makeRequest<{ message: string }>(`/resources/${id}`, {
      method: 'DELETE',
    });
  }

  // Faculties and Programs
  async getFaculties(): Promise<ApiResponse<{ id: string; name: string }[]>> {
    // Mock data for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: [
            { id: '1', name: 'Faculty of Engineering' },
            { id: '2', name: 'Faculty of Science' },
            { id: '3', name: 'Faculty of Arts' },
            { id: '4', name: 'Faculty of Business' },
            { id: '5', name: 'Faculty of Medicine' },
            { id: '6', name: 'Faculty of Law' },
          ],
        });
      }, 500);
    });
  }

  async getPrograms(facultyId: string): Promise<ApiResponse<{ id: string; name: string }[]>> {
    // Mock data for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        const programs = {
          '1': [ // Engineering
            { id: '1', name: 'Computer Science' },
            { id: '2', name: 'Electrical Engineering' },
            { id: '3', name: 'Mechanical Engineering' },
            { id: '4', name: 'Civil Engineering' },
          ],
          '2': [ // Science
            { id: '5', name: 'Mathematics' },
            { id: '6', name: 'Physics' },
            { id: '7', name: 'Chemistry' },
            { id: '8', name: 'Biology' },
          ],
          // Add more as needed
        };

        resolve({
          success: true,
          data: programs[facultyId as keyof typeof programs] || [],
        });
      }, 500);
    });
  }

  // Dashboard/Stats endpoints
  async getDashboardStats(): Promise<ApiResponse<{
    totalResources: number;
    pendingAssignments: number;
    completionRate: number;
    recentActivity: any[];
  }>> {
    // Mock data for demo
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            totalResources: 24,
            pendingAssignments: 5,
            completionRate: 89,
            recentActivity: [
              {
                id: 1,
                title: 'Advanced Mathematics Notes',
                subtitle: 'Chapter 5: Calculus Integration',
                type: 'notes',
                date: '2 hours ago',
                progress: 85,
              },
              {
                id: 2,
                title: 'Physics Lab Report',
                subtitle: 'Quantum Mechanics Experiment',
                type: 'assignment',
                date: 'Due tomorrow',
                progress: 60,
              },
            ],
          },
        });
      }, 1000);
    });
  }
}

export const apiService = new ApiService();
export type { User, Resource, AuthResponse, LoginRequest, RegisterRequest };