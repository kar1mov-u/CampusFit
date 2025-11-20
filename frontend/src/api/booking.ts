import api from './axios';
import { Booking, CreateBookingRequest, ApiResponse } from '../types';

export const bookingService = {
  getAll: async (): Promise<Booking[]> => {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/all');
    return response.data.data;
  },

  getByFacility: async (facilityId: string, date?: string): Promise<Booking[]> => {
    const params = date ? { date } : {};
    const response = await api.get<ApiResponse<Booking[]>>(`/bookings/facility/${facilityId}`, { params });
    return response.data.data;
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get<ApiResponse<Booking[]>>('/bookings/me');
    return response.data.data;
  },

  create: async (data: CreateBookingRequest): Promise<Booking> => {
    const response = await api.post<ApiResponse<Booking>>('/bookings', data);
    return response.data.data;
  },

  cancel: async (id: string): Promise<void> => {
    await api.delete(`/bookings/${id}`);
  },

  update: async (id: string, data: Partial<CreateBookingRequest>): Promise<Booking> => {
    const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}`, data);
    return response.data.data;
  },
};
