import api from './api';
import type { Video } from '../types/video';

export const videoService = {
  uploadVideo: async (formData: FormData): Promise<Video> => {
    // formData doit contenir 'title', 'description', et 'file'
    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getMyVideos: async (): Promise<Video[]> => {
    const response = await api.get('/videos/me');
    return response.data;
  },

  getPendingVideos: async (): Promise<Video[]> => {
    const response = await api.get('/videos/pending');
    return response.data;
  },

  consentToVideo: async (videoId: string, action: 'approve' | 'reject'): Promise<Video> => {
    const formData = new FormData();
    formData.append('action', action);
    const response = await api.put(`/videos/${videoId}/consent`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getFeed: async (page = 1, limit = 10, sortBy = 'recent'): Promise<any[]> => {
    // any[] should be VideoFeedResponse[] but we need to import it
    const response = await api.get(`/videos/feed?page=${page}&limit=${limit}&sort_by=${sortBy}`);
    return response.data;
  },

  likeVideo: async (videoId: string): Promise<{action: string, liked: boolean, likes_count: number}> => {
    const response = await api.post(`/videos/${videoId}/like`);
    return response.data;
  },

  viewVideo: async (videoId: string, sessionId: string, watchedSeconds: number, completed: boolean): Promise<{status: string, views_count: number}> => {
    const response = await api.post(`/videos/${videoId}/view`, {
      session_id: sessionId,
      watched_seconds: watchedSeconds,
      completed: completed
    });
    return response.data;
  },

  reportVideo: async (videoId: string, reason: string): Promise<{status: string}> => {
    const response = await api.post(`/videos/${videoId}/report`, { reason });
    return response.data;
  },

  getVideoStats: async (videoId: string): Promise<{views: number, likes: number, liked: boolean}> => {
    const response = await api.get(`/videos/${videoId}/stats`);
    return response.data;
  },
};
