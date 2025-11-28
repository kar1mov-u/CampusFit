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

    // Create weekly schedule (placeholder for future backend)
    createWeeklySchedule: async (data: any) => {
        // TODO: Implement when backend endpoint is ready
        console.log('Creating schedule:', data);
        return Promise.resolve({ success: true, message: 'Schedule created', data: null });
    },

    // Get weekly schedules (placeholder for future backend)
    getWeeklySchedules: async (trainerId: string) => {
        // TODO: Implement when backend endpoint is ready
        console.log('Getting schedules for trainer:', trainerId);
        return Promise.resolve({ success: true, message: 'Schedules retrieved', data: [] });
    },
};
