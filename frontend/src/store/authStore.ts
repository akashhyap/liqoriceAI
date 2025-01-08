import {create} from 'zustand';
import { AuthState, User, PasswordUpdateRequest } from '../types';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const useAuthStore = create<AuthState & {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
    updateUser: (userData: Partial<User> | PasswordUpdateRequest) => Promise<void>;
    isSuperAdmin: () => boolean;
}>((set, get) => ({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (email, password) => {
        try {
            set({ isLoading: true });
            const res = await axios.post(`${API_URL}/auth/login`, {
                email,
                password
            });

            localStorage.setItem('token', res.data.token);

            set({
                token: res.data.token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            await useAuthStore.getState().loadUser();
        } catch (err: any) {
            localStorage.removeItem('token');
            set({
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: err.response?.data?.error || 'An error occurred'
            });
        }
    },

    register: async (name, email, password) => {
        try {
            set({ isLoading: true });
            const res = await axios.post(`${API_URL}/auth/register`, {
                name,
                email,
                password,
                subscription: 'free'
            });

            localStorage.setItem('token', res.data.token);

            set({
                token: res.data.token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            await useAuthStore.getState().loadUser();
        } catch (err: any) {
            localStorage.removeItem('token');
            set({
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: err.response?.data?.error || 'An error occurred'
            });
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        set({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
        });
    },

    loadUser: async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false
                });
                return;
            }

            set({ isLoading: true });

            const res = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            set({
                user: res.data.data,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });
        } catch (err: any) {
            localStorage.removeItem('token');
            set({
                token: null,
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: err.response?.data?.error || 'An error occurred'
            });
        }
    },

    updateUser: async (userData) => {
        try {
            set({ isLoading: true });
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            const isPasswordUpdate = 'currentPassword' in userData;
            const endpoint = isPasswordUpdate 
                ? `${API_URL}/auth/update-password`
                : `${API_URL}/auth/me`;

            const res = await axios.put(endpoint, userData, config);

            if (!isPasswordUpdate) {
                set(state => ({
                    user: { ...state.user, ...res.data.data } as User,
                    isLoading: false,
                    error: null
                }));
            } else {
                // For password update, we get a new token
                localStorage.setItem('token', res.data.token);
                set({ 
                    token: res.data.token,
                    isLoading: false,
                    error: null
                });
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
            set({ 
                isLoading: false,
                error: errorMessage
            });
            throw new Error(errorMessage);
        }
    },

    isSuperAdmin: () => {
        const state = get();
        return state.user?.role === 'super_admin';
    },
}));

export default useAuthStore;
