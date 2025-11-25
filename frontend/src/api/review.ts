import api from './axios';
import { ApiResponse, Review, CreateReviewRequest, FacilityRating } from '../types';

export const reviewApi = {
    createReview: async (facilityId: string, data: CreateReviewRequest) => {
        const response = await api.post<ApiResponse<null>>(
            `/facility/${facilityId}/review`,
            data
        );
        return response.data;
    },

    deleteReview: async (reviewId: string) => {
        const response = await api.delete<ApiResponse<null>>(
            `/facility/review/${reviewId}`
        );
        return response.data;
    },

    getReviews: async (facilityId: string, offset: number = 0) => {
        const response = await api.get<ApiResponse<Review[]>>(
            `/facility/${facilityId}/reviews`,
            { params: { offset } }
        );
        return response.data;
    },

    getRating: async (facilityId: string) => {
        const response = await api.get<ApiResponse<FacilityRating>>(
            `/facility/${facilityId}/rating`
        );
        return response.data;
    },
};
