import api from './axios';
import { ApiResponse, Trainer, UpdateTrainerRequest } from '../types';

export const trainerApi = {
    // Get trainer profile by trainer ID
    getTrainerProfile: async (trainerId: string) => {
        const response = await api.get<ApiResponse<Trainer>>(`/trainers/${trainerId}`);
        return response.data;
    },

    // Update trainer profile (bio, specialty)
    updateTrainerProfile: async (trainerId: string, data: UpdateTrainerRequest) => {
        const response = await api.patch<ApiResponse<null>>(`/trainers/${trainerId}`, data);
        return response.data;
    },

    // List all trainers
    listTrainers: async (offset: number = 0) => {
        const response = await api.get<ApiResponse<Trainer[]>>(`/trainers?offset=${offset}`);
        return response.data;
    },

    // Create weekly schedule
    createWeeklySchedule: async (data: any) => {
        const response = await api.post<ApiResponse<any>>('/schedules', data);
        return response.data;
    },

    // Get weekly schedules
    getWeeklySchedules: async (trainerId: string) => {
        const response = await api.get<ApiResponse<any[]>>(`/schedules/trainer/${trainerId}`);
        return response.data;
    },

    // Delete schedule
    deleteSchedule: async (scheduleId: string) => {
        const response = await api.delete<ApiResponse<null>>(`/schedules/${scheduleId}`);
        return response.data;
    },
};
