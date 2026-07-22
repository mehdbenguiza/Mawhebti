import api from './api';
import type { LoginRequest, UserCreate, AuthResponse } from '../types/auth';
import type { User } from '../store/authStore';

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },
  register: async (data: UserCreate) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
  updateAccount: async (data: { email?: string, phone_number?: string, current_password?: string, new_password?: string }) => {
    const response = await api.patch('/auth/me/account', data);
    return response.data;
  }
};
