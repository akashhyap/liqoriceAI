import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import SuperAdminLogin from '../pages/super-admin/Login';
import Dashboard from '../components/super-admin/Dashboard';
import UsersManagement from '../components/super-admin/UsersManagement';
import Subscriptions from '../components/super-admin/Subscriptions';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('superAdminToken');
    if (!token) {
        return <Navigate to="/super-admin/login" replace />;
    }
    return <>{children}</>;
};

const SuperAdminRoutes = () => {
    return (
        <Routes>
            <Route path="/super-admin/login" element={<SuperAdminLogin />} />
            
            <Route
                path="/super-admin"
                element={
                    <ProtectedRoute>
                        <SuperAdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="users" element={<UsersManagement />} />
                <Route path="subscriptions" element={<Subscriptions />} />
                <Route path="settings" element={<div>Settings Page</div>} />
                <Route path="profile" element={<div>Profile Page</div>} />
            </Route>

            {/* Catch all undefined routes */}
            <Route path="/super-admin/*" element={<Navigate to="/super-admin/login" replace />} />
        </Routes>
    );
};

export default SuperAdminRoutes;
