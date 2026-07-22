import api from './api';
import type { ProfileUpdate, ProfileResponsePrivate } from '../types/profile';

export const profileService = {
  getMyProfile: async (): Promise<ProfileResponsePrivate> => {
    const response = await api.get<ProfileResponsePrivate>('/profiles/me');
    return response.data;
  },
  updateMyProfile: async (data: ProfileUpdate): Promise<ProfileResponsePrivate> => {
    const response = await api.put<ProfileResponsePrivate>('/profiles/me', data);
    return response.data;
  },
  uploadAvatar: async (file: File): Promise<ProfileResponsePrivate> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ProfileResponsePrivate>('/profiles/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
