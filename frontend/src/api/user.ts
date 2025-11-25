import api from './axios';
import { User, ApiResponse, Booking } from '../types';

export const userService = {
  getAll: async (offset: number = 0, keyword: string = ''): Promise<User[]> => {
    const params = new URLSearchParams();
    params.append('offset', offset.toString());
    if (keyword) {
      params.append('keyword', keyword);
    }
    const response = await api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
    return response.data.data;
  },

  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  getBookings: async (userId: string, offset: number = 0): Promise<Booking[]> => {
    const response = await api.get<ApiResponse<Booking[]>>(`/users/${userId}/bookings?offset=${offset}`);
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
