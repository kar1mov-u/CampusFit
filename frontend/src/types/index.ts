export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'student' | 'admin';
  phone_number?: string;
  credit_score?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
  };
}

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  phone?: string;
}

export interface Facility {
  id: string;
  name: string;
  type: 'football' | 'basketball' | 'tennis';
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
  type: 'football' | 'basketball' | 'tennis';
  description: string;
  capacity: number;
  open_time: string;
  close_time: string;
  image_url: string;
  is_active: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  facility_id: string;
  date: string;
  start_time: string;  // "10:00"
  end_time: string;    // "11:00"
  note: string;
  is_canceled: boolean;
  admin_note: string;
  created_at: string;
}

export interface CreateBookingRequest {
  facility_id: string;
  date: string;        // "2025-11-22"
  start_time: string;  // "10:00"
  end_time: string;    // "11:00"
  note?: string;
}

// Generic API Response wrapper from backend
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
