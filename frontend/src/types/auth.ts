export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserCreate {
  email: string;
  password: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}
