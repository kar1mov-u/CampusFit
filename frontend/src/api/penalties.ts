import api from './axios';
import { ApiResponse } from '../types';

export interface Penalty {
    id: string;
    user_id: string;
    given_by_id: string;
    session_id?: string;
    booking_id?: string;
    reason: string;
    points: number;
    penalty_type: string;
    created_at: string;
    facility_name?: string;
    session_date?: string;
    booking_date?: string;
    context_info?: string;
    user_name?: string;
}

export interface CreatePenaltyRequest {
    user_id: string;
    session_id?: string;
    booking_id?: string;
    reason: string;
    points: number;
    penalty_type: string;
}

export const penaltyApi = {
    createPenalty: async (data: CreatePenaltyRequest) => {
        const response = await api.post<ApiResponse<null>>('/penalties', data);
        return response.data;
    },

    deletePenalty: async (id: string) => {
        const response = await api.delete<ApiResponse<null>>(`/penalties/${id}`);
        return response.data;
    },

    getPenaltiesForUser: async (userId: string) => {
        const response = await api.get<ApiResponse<Penalty[]>>(`/penalties/user/${userId}`);
        return response.data;
    },

    getGivenPenalties: async (userId: string) => {
        const response = await api.get<ApiResponse<Penalty[]>>(`/penalties/given/${userId}`);
        return response.data;
    },
};
