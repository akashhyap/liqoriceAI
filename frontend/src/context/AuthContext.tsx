import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../services/axios';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  endImpersonation: () => void;
  isImpersonating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const impersonating = localStorage.getItem('isImpersonating') === 'true';
    setIsImpersonating(impersonating);
    
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('isImpersonating');
      localStorage.removeItem('originalAdminToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/users/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to login. Please try again.');
      }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await axios.post('/users/register', {
        email,
        password,
        name,
        subscription: 'free' // Set default subscription to free
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to register. Please try again.');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isImpersonating');
    localStorage.removeItem('originalAdminToken');
    setUser(null);
    setIsImpersonating(false);
  };

  const endImpersonation = () => {
    const originalToken = localStorage.getItem('originalAdminToken');
    if (originalToken) {
      localStorage.setItem('token', originalToken);
      localStorage.removeItem('isImpersonating');
      localStorage.removeItem('originalAdminToken');
      setIsImpersonating(false);
      window.location.href = '/super-admin/users';
    }
  };

  const updateUser = async (data: Partial<User>) => {
    const response = await axios.patch('/auth/profile', data);
    setUser(response.data);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    endImpersonation,
    isImpersonating
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
