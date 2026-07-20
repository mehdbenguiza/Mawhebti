import api from './api';
import { ProfileUpdate, ProfileResponsePrivate } from '../types/profile';

export const profileService = {
  getMyProfile: async (): Promise<ProfileResponsePrivate> => {
    const response = await api.get<ProfileResponsePrivate>('/profiles/me');
    return response.data;
  },
  updateMyProfile: async (data: ProfileUpdate): Promise<ProfileResponsePrivate> => {
    const response = await api.put<ProfileResponsePrivate>('/profiles/me', data);
    return response.data;
  },
};
