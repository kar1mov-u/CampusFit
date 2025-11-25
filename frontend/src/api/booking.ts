import api from './axios';
import { Booking, CreateBookingRequest, ApiResponse } from '../types';

export const bookingApi = {
  getByFacility: async (facilityId: string, date: string) => {
    const response = await api.get<ApiResponse<Booking[]>>(`/bookings/facility/${facilityId}?date=${date}`);
    return response.data;
  },

  getAll: async (startDate: string, endDate: string, offset: number = 0) => {
    const response = await api.get<ApiResponse<Booking[]>>(`/bookings?start_date=${startDate}&date=${endDate}&offset=${offset}`);
    return response.data;
  },

  create: async (data: CreateBookingRequest) => {
    const response = await api.post<ApiResponse<Booking>>('/bookings', data);
    return response.data;
  },

  cancel: async (id: string, adminNote?: string) => {
    const response = await api.post(`/bookings/cancel/${id}`, { admin_note: adminNote || '' });
    return response.data;
  },
};
