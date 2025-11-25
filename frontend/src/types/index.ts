// Generic API Response wrapper from backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  phone?: string;
  credit_score?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type LoginCredentials = LoginRequest;

export interface LoginResponseData {
  token: string;
}

export type AuthResponse = ApiResponse<LoginResponseData>;

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'student' | 'staff';
  phone?: string;
}

export type RegisterData = CreateUserRequest;

export interface Facility {
  id: string;
  name: string;
  type: 'football' | 'basketball' | 'tennis' | 'volleyball' | 'swimming';
  description: string;
  capacity: number;
  open_time: string;
  close_time: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFacilityRequest {
  name: string;
  type: string;
  description: string;
  capacity: number;
  open_time: string;
  close_time: string;
  image_url: string;
}

export interface Booking {
  id: string;
  user_id: string;
  facility_id: string;
  date: string;
  start_time: string;
  end_time: string;
  note: string;
  is_canceled: boolean;
  admin_note: string;
  created_at: string;
}

export interface CreateBookingRequest {
  facility_id: string;
  date: string;
  start_time: string;
  end_time: string;
  note?: string;
}

export interface Review {
  id: string;
  facility_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

export interface FacilityRating {
  facility_id: string;
  average_rating: number;
}

