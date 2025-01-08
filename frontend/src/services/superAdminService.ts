import axios from 'axios';

const API_URL = '/api/super-admin';

export interface DashboardStats {
    totalUsers: number;
    activeSubscriptions: number;
    recentSignups: any[];
}

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    subscription: string;
    subscriptionDetails?: {
        status: string;
        currentPeriodEnd: Date;
    };
}

export interface AuditLog {
    _id: string;
    action: string;
    performedBy: {
        _id: string;
        name: string;
        email: string;
    };
    targetUser: {
        _id: string;
        name: string;
        email: string;
    };
    details: string;
    createdAt: string;
    ip: string;
    userAgent: string;
}

class SuperAdminService {
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await axios.get(`${API_URL}/dashboard-stats`);
        return response.data.data;
    }

    async getUsers(params: { page?: number; limit?: number; search?: string; status?: string; subscription?: string } = {}) {
        const response = await axios.get(`${API_URL}/users`, { params });
        return response.data;
    }

    async getUser(userId: string) {
        const response = await axios.get(`${API_URL}/users/${userId}`);
        return response.data.data;
    }

    async updateUser(userId: string, userData: Partial<User>) {
        const response = await axios.put(`${API_URL}/users/${userId}`, userData);
        return response.data.data;
    }

    async deleteUser(userId: string) {
        const response = await axios.delete(`${API_URL}/users/${userId}`);
        return response.data;
    }

    async manageSubscription(userId: string, action: 'cancel' | 'update', plan?: string) {
        const response = await axios.put(`${API_URL}/users/${userId}/subscription`, {
            action,
            plan
        });
        return response.data.data;
    }

    async getAuditLogs(params: { page?: number; limit?: number; action?: string; userId?: string } = {}) {
        const response = await axios.get(`${API_URL}/audit-logs`, { params });
        return response.data;
    }

    async createSuperAdmin(data: { name: string; email: string; password: string }) {
        const response = await axios.post(`${API_URL}/create`, data);
        return response.data;
    }
}

export default new SuperAdminService();
