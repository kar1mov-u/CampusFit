import api from './axios';
import { Facility, ApiResponse } from '../types';

export const facilityApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<Facility[]>>('/facility/all');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<Facility>>(`/facility/${id}`);
    return response.data;
  },

  create: async (data: Omit<Facility, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
    const response = await api.post<ApiResponse<Facility>>('/facility', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Facility>) => {
    const response = await api.patch<ApiResponse<Facility>>(`/facility/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/facility/${id}`);
  },
};

