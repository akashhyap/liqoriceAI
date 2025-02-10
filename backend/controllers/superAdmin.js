import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/async.js';
import stripe from '../config/stripe.js';
import jwt from 'jsonwebtoken';
import { catchAsync, AppError } from '../middleware/errorHandler.js';

// @desc    Get dashboard statistics
// @route   GET /api/super-admin/dashboard-stats
// @access  Super Admin
export const getDashboardStats = catchAsync(async (req, res) => {
    const totalUsers = await User.countDocuments({ role: { $ne: 'super_admin' } });
    const activeSubscriptions = await User.countDocuments({
        'subscriptionDetails.status': 'active',
        subscription: { $ne: 'free' },
        role: { $ne: 'super_admin' }
    });
    const recentSignups = await User.find({ role: { $ne: 'super_admin' } })
        .sort('-createdAt')
        .limit(5)
        .select('name email subscription createdAt');

    res.status(200).json({
        success: true,
        data: {
            totalUsers,
            activeSubscriptions,
            recentSignups
        }
    });
});

// @desc    Get all users
// @route   GET /api/super-admin/users
// @access  Private/Super Admin
export const getUsers = catchAsync(async (req, res) => {
    const users = await User.find({ role: { $ne: 'super_admin' } })
        .select('-password -__v')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        data: users
    });
});

// @desc    Get single user
// @route   GET /api/super-admin/users/:id
// @access  Private/Super Admin
export const getUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password -__v');

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Update user
// @route   PUT /api/super-admin/users/:id
// @access  Private/Super Admin
export const updateUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Prevent super admin from being modified by another super admin
    if (user.role === 'super_admin' && req.user.id !== user._id.toString()) {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to modify another super admin'
        });
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    ).select('-password -__v');

    res.status(200).json({
        success: true,
        data: updatedUser
    });
});

// @desc    Delete user
// @route   DELETE /api/super-admin/users/:id
// @access  Private/Super Admin
export const deleteUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Prevent super admin from being deleted
    if (user.role === 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Super admin cannot be deleted'
        });
    }

    await user.deleteOne();

    res.status(200).json({
        success: true,
        data: {}
    });
});

// @desc    Update user subscription
// @route   PUT /api/super-admin/users/:id/subscription
// @access  Private/Super Admin
export const manageSubscription = catchAsync(async (req, res) => {
    const { subscription } = req.body;
    
    if (!['free', 'starter', 'professional'].includes(subscription)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid subscription type'
        });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    user.subscription = subscription;
    await user.save();

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Impersonate a user (super admin access user account)
// @route   POST /api/super-admin/users/:id/impersonate
// @access  Private/Super Admin
export const impersonateUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Prevent impersonating another super admin
    if (user.role === 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Cannot impersonate another super admin'
        });
    }

    // Create an impersonation token that includes both user and super admin info
    const token = jwt.sign(
        {
            id: user._id,
            originalAdmin: req.user._id,
            isImpersonating: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Create audit log
    await AuditLog.create({
        action: 'user_impersonation',
        performedBy: req.user._id,
        targetUser: user._id,
        details: {
            message: 'Super admin impersonated user account',
            impersonatedUser: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        },
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    // Send response with impersonation token and user data
    res.status(200).json({
        success: true,
        data: {
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                subscription: user.subscription
            }
        }
    });
});

// @desc    Create another super admin (only existing super admin can create)
// @route   POST /api/super-admin/create
// @access  Super Admin
export const createSuperAdmin = catchAsync(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new AppError('User already exists', 400, 'USER_ALREADY_EXISTS');
    }

    // Create user with super admin role
    const user = await User.create({
        name,
        email,
        password,
        role: 'super_admin',
        status: 'active',
        subscription: 'professional'
    });

    // Create audit log
    await AuditLog.create({
        action: 'user_create',
        performedBy: req.user._id,
        targetUser: user._id,
        details: 'Created new super admin user',
        newState: { name: user.name, email: user.email, role: user.role },
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    res.status(201).json({
        success: true,
        data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

// @desc    Get audit logs
// @route   GET /api/super-admin/audit-logs
// @access  Super Admin
export const getAuditLogs = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    
    if (req.query.action) {
        query.action = req.query.action;
    }
    if (req.query.userId) {
        query.targetUser = req.query.userId;
    }

    const logs = await AuditLog.find(query)
        .populate('performedBy', 'name email')
        .populate('targetUser', 'name email')
        .sort('-createdAt')
        .skip(startIndex)
        .limit(limit);

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
        success: true,
        data: logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});
