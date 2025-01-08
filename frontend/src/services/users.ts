import api from './api';

export interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    subscription: string;
    status: string;
    createdAt: string;
}

export const getUsers = async () => {
    const response = await api.get('/super-admin/users');
    return response.data;
};

export const getUser = async (userId: string) => {
    const response = await api.get(`/super-admin/users/${userId}`);
    return response.data;
};

export const updateUserSubscription = async (userId: string, subscription: string) => {
    const response = await api.put(`/super-admin/users/${userId}/subscription`, { subscription });
    return response.data;
};

export const deleteUser = async (userId: string) => {
    const response = await api.delete(`/super-admin/users/${userId}`);
    return response.data;
};
