import express from 'express';
import {
    getDashboardStats,
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    manageSubscription,
    getAuditLogs,
    createSuperAdmin,
    impersonateUser
} from '../controllers/superAdmin.js';

import {
    loginSuperAdmin,
    getSuperAdminProfile
} from '../controllers/auth/superAdminAuth.js';

import { protect } from '../middleware/auth.js';
import isSuperAdmin from '../middleware/isSuperAdmin.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import AuditLog from '../models/AuditLog.js';

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

// User impersonation route
router.post('/users/:id/impersonate', impersonateUser);

// Subscription management routes
router.put('/users/:id/subscription', manageSubscription);

// Get users with their subscription details
router.get('/subscriptions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status;
        const plan = req.query.plan;

        // Build user query
        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Get users with their subscription details
        const users = await User.aggregate([
            { $match: query },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'subscription'
                }
            },
            {
                $addFields: {
                    subscription: { $arrayElemAt: ['$subscription', 0] }
                }
            },
            // Filter by subscription status and plan if provided
            ...(status || plan ? [{
                $match: {
                    ...(status && { 'subscription.status': status }),
                    ...(plan && { 'subscription.plan': plan })
                }
            }] : []),
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]);

        // Transform data to match frontend expectations
        const transformedData = users.map(user => ({
            _id: user._id,
            userId: {
                _id: user._id,
                name: user.name,
                email: user.email
            },
            plan: user.subscription?.plan || 'free',
            status: user.subscription?.status || 'active',
            currentPeriodEnd: user.subscription?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
            createdAt: user.createdAt
        }));

        res.json({
            success: true,
            data: transformedData,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users with subscriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users with subscriptions',
            error: error.message
        });
    }
});

// Update user's subscription
router.put('/subscriptions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, plan, cancelAtPeriodEnd } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Find or create subscription
        let subscription = await Subscription.findOne({ userId });
        if (!subscription) {
            subscription = new Subscription({
                userId,
                plan: plan || 'free',
                status: status || 'active',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
        }

        // Update subscription
        if (status) subscription.status = status;
        if (plan) subscription.plan = plan;
        if (typeof cancelAtPeriodEnd === 'boolean') {
            subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;
        }

        await subscription.save();

        // Log the action
        await AuditLog.create({
            action: 'subscription_update',
            performedBy: req.user._id,
            targetUser: userId,
            details: `Subscription updated - Plan: ${plan}, Status: ${status}`,
            ip: req.ip,
            userAgent: req.get('user-agent')
        });

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subscription',
            error: error.message
        });
    }
});

// Audit and monitoring routes
router.get('/audit-logs', getAuditLogs);

// Super admin management routes
router.post('/create', createSuperAdmin);

export default router;
