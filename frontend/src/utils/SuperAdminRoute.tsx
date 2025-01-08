import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SuperAdminRouteProps {
    children: React.ReactNode;
}

const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
    const { user, isSuperAdmin } = useAuth();
    const location = useLocation();

    if (!user || !isSuperAdmin) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default SuperAdminRoute;
