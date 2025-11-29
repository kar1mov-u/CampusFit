import api from './axios';
import { ApiResponse, Registration } from '../types';

export interface CreateRegistrationRequest {
    session_id: string;
}

export const registrationApi = {
    // Create a new registration
    create: async (data: CreateRegistrationRequest) => {
        const response = await api.post<ApiResponse<null>>('/registrations', data);
        return response.data;
    },

    // Cancel a registration
    cancel: async (id: string) => {
        const response = await api.post<ApiResponse<null>>(`/registrations/cancel/${id}`);
        return response.data;
    },

    // List registrations for a session
    listSessionRegistrations: async (sessionId: string) => {
        const response = await api.get<ApiResponse<Registration[]>>(`/registrations/session/${sessionId}`);
        return response.data;
    },

    // List registrations for a user
    listUserRegistrations: async (userId: string, offset: number = 0) => {
        const response = await api.get<ApiResponse<Registration[]>>(`/registrations/user/${userId}?offset=${offset}`);
        return response.data;
    },
};
