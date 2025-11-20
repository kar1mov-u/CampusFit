import api from './axios';
import { User, ApiResponse } from '../types';

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users/all');
    return response.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  update: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },
};
