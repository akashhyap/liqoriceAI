import User from '../../models/User.js';
import ErrorResponse from '../../utils/errorResponse.js';
import { catchAsync } from '../../middleware/errorHandler.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// @desc    Login super admin
// @route   POST /api/super-admin/login
// @access  Public
export const loginSuperAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        // Debug: List all super admin users
        const allSuperAdmins = await User.find({ role: 'super_admin' });
        console.log('All super admin users:', allSuperAdmins.map(admin => ({
            email: admin.email,
            role: admin.role
        })));

        // Validate email & password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user with case-insensitive email
        const user = await User.findOne({
            email: email.toLowerCase(),
            role: 'super_admin'
        }).select('+password');

        console.log('User found:', user ? 'Yes' : 'No');
        if (user) {
            console.log('Found user email:', user.email);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Match password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token with fixed expiration
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }  // Set to 30 days
        );

        // Send response
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Get current logged in super admin
// @route   GET /api/super-admin/me
// @access  Private/Super Admin
export const getSuperAdminProfile = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user
    });
});

// @desc    Create another super admin
// @route   POST /api/super-admin/create
// @access  Private/Super Admin
export const createSuperAdmin = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role: 'super_admin'
    });

    res.status(201).json({
        success: true,
        data: user
    });
});
