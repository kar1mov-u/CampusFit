import api from './axios';
import { ApiResponse, Session } from '../types';

export const sessionApi = {
    // List sessions for a facility on a specific date
    listFacilitySessions: async (facilityId: string, date: string) => {
        const response = await api.get<ApiResponse<Session[]>>(`/sessions/facility/${facilityId}?date=${date}`);
        return response.data;
    },
};
