export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserCreate {
  email: string;
  password: string;
  role: string;
  parent_email?: string;
  phone_number?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
