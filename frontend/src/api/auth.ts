import api from './axios';
import { LoginRequest, LoginResponse, CreateUserRequest, User, ApiResponse } from '../types';

export const authService = {
  login: async (data: LoginRequest): Promise<{ token: string; user: User }> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    const token = response.data.data.token;
    
    // Set token in axios instance for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Fetch user info
    const userResponse = await api.get<ApiResponse<User>>('/users/me');
    
    return {
      token,
      user: userResponse.data.data,
    };
  },

  register: async (data: CreateUserRequest): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data.data;
  },
};
