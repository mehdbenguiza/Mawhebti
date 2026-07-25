import api from './api';
import { Notification, NotificationListResponse, NotificationSettings, NotificationSummary } from '../types/notification';

class NotificationService {
    async getNotifications(page: number = 1, size: number = 20): Promise<NotificationListResponse> {
        const response = await api.get('/notifications', { params: { page, size } });
        return response.data;
    }

    async getSummary(): Promise<NotificationSummary> {
        const response = await api.get('/notifications/summary');
        return response.data;
    }

    async markAllAsSeen(): Promise<void> {
        await api.put('/notifications/seen');
    }

    async markAsRead(notificationId: string): Promise<Notification> {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    }

    async deleteNotification(notificationId: string): Promise<void> {
        await api.delete(`/notifications/${notificationId}`);
    }

    async getSettings(): Promise<NotificationSettings> {
        const response = await api.get('/notifications/settings');
        return response.data;
    }

    async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
        const response = await api.put('/notifications/settings', settings);
        return response.data;
    }
}

export const notificationService = new NotificationService();
