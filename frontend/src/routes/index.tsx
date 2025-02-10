import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import SuperAdminRoute from '../utils/SuperAdminRoute';
import SuperAdminLayout from '../components/super-admin/SuperAdminLayout';
import Dashboard from '../components/super-admin/Dashboard';
import UsersManagement from '../components/super-admin/UsersManagement';
import AuditLogs from '../components/super-admin/AuditLogs';
import CreateSuperAdmin from '../components/super-admin/CreateSuperAdmin';
import Login from '../components/auth/Login';

const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/super-admin',
        element: (
            <SuperAdminRoute>
                <SuperAdminLayout />
            </SuperAdminRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />
            },
            {
                path: 'users',
                element: <UsersManagement />
            },
            {
                path: 'audit-logs',
                element: <AuditLogs />
            },
            {
                path: 'create',
                element: <CreateSuperAdmin />
            }
        ]
    },
    {
        path: '*',
        element: <Navigate to="/login" replace />
    }
]);

export default router;
