import api from './axios';
import { LoginCredentials, RegisterData, AuthResponse, User, ApiResponse } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post<ApiResponse<{ user_id: string }>>('/users', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get<ApiResponse<User>>('/users/me');
    return response.data;
  },
};
