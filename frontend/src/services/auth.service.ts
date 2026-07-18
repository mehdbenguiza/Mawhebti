import api from './api';
import { LoginRequest, UserCreate, AuthResponse } from '../types/auth';
import { User } from '../store/authStore';

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
  }
};
