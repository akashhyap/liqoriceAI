import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            subscription: 'free'
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Please provide an email and password'
            });
        }

        // Check for user
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Generate API key
// @route   POST /api/auth/apikey
// @access  Private
export const generateApiKey = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        const apiKey = user.generateApiKey();
        await user.save();

        res.status(200).json({
            success: true,
            data: apiKey
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update user details
// @route   PUT /api/auth/me
// @access  Private
export const updateMe = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name,
            email: req.body.email
        };

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        const isMatch = await user.matchPassword(req.body.currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = req.body.newPassword;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
};

// @desc    Update notification settings
// @route   PUT /api/auth/notification-settings
// @access  Private
export const updateNotificationSettings = async (req, res, next) => {
    try {
        const { email, push } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update notification settings
        if (email) {
            user.notificationSettings.email = {
                ...user.notificationSettings.email,
                ...email
            };
        }
        
        if (push) {
            user.notificationSettings.push = {
                ...user.notificationSettings.push,
                ...push
            };
        }

        await user.save();

        res.json({
            success: true,
            data: user.notificationSettings
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get notification settings
// @route   GET /api/auth/notification-settings
// @access  Private
export const getNotificationSettings = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.notificationSettings
        });
    } catch (err) {
        next(err);
    }
};
