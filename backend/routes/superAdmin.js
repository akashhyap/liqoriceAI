import express from 'express';
import {
    getDashboardStats,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    manageSubscription,
    getAuditLogs,
    createSuperAdmin
} from '../controllers/superAdmin.js';

import {
    loginSuperAdmin,
    getSuperAdminProfile
} from '../controllers/auth/superAdminAuth.js';

import { protect } from '../middleware/auth.js';
import isSuperAdmin from '../middleware/isSuperAdmin.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', loginSuperAdmin);

// Protected routes (require authentication and super admin role)
router.use(protect, isSuperAdmin);

// Profile routes
router.get('/me', getSuperAdminProfile);

// Dashboard routes
router.get('/dashboard-stats', getDashboardStats);

// User management routes
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Subscription management routes
router.put('/users/:id/subscription', manageSubscription);

// Audit and monitoring routes
router.get('/audit-logs', getAuditLogs);

// Super admin management routes
router.post('/create', createSuperAdmin);

export default router;
