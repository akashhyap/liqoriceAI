import axios from './axios';

export interface NotificationSettings {
    email: {
        newMessages: boolean;
        weeklyReports: boolean;
        systemUpdates: boolean;
    };
    push: {
        enabled: boolean;
    };
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const notificationService = {
    async getNotificationSettings(): Promise<NotificationSettings> {
        const response = await axios.get(`${API_URL}/api/auth/notification-settings`);
        return response.data.data;
    },

    async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
        await axios.put(`${API_URL}/api/auth/notification-settings`, settings);
    }
};

export default notificationService;
