import api from './axios';
import { Facility, CreateFacilityRequest, ApiResponse } from '../types';

export const facilityService = {
  getAll: async (): Promise<Facility[]> => {
    const response = await api.get<ApiResponse<Facility[]>>('/facility/all');
    return response.data.data;
  },

  getById: async (id: string): Promise<Facility> => {
    const response = await api.get<ApiResponse<Facility>>(`/facility/${id}`);
    return response.data.data;
  },

  create: async (data: CreateFacilityRequest): Promise<Facility> => {
    const response = await api.post<ApiResponse<Facility>>('/facility', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateFacilityRequest>): Promise<Facility> => {
    const response = await api.patch<ApiResponse<Facility>>(`/facility/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/facility/${id}`);
  },
};
