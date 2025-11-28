import api from './axios';
import { ApiResponse, Trainer } from '../types';

export const adminApi = {
    // Promote user to trainer
    promoteToTrainer: async (userId: string) => {
        const response = await api.post<ApiResponse<null>>('/trainers', { user_id: userId });
        return response.data;
    },

    // Remove trainer status (delete trainer)
    removeTrainer: async (trainerId: string) => {
        const response = await api.delete<ApiResponse<null>>(`/trainers/${trainerId}`);
        return response.data;
    },

    // List all trainers
    listTrainers: async () => {
        const response = await api.get<ApiResponse<Trainer[]>>('/trainers');
        return response.data;
    },
};
