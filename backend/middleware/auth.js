import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from 'dotenv';

config();

// Protect routes
const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id);
            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }
    } catch (err) {
        next(err);
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'User role is not authorized to access this route'
            });
        }
        next();
    };
};

// API key authentication
const apiKeyAuth = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'API key is required'
            });
        }

        const user = await User.findOne({ apiKey });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid API key'
            });
        }

        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
};

// Rate limiting by subscription
const subscriptionRateLimit = async (req, res, next) => {
    try {
        const limits = {
            free: 100,
            basic: 1000,
            premium: 10000,
            enterprise: Infinity
        };

        const user = req.user;
        const monthlyLimit = limits[user.subscription];

        if (user.usage.messages >= monthlyLimit) {
            return res.status(429).json({
                success: false,
                error: 'Monthly usage limit reached'
            });
        }

        next();
    } catch (err) {
        next(err);
    }
};

// Super Admin authentication middleware
const authenticateSuperAdmin = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies?.superAdminToken) {
            token = req.cookies.superAdminToken;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user || !user.isSuperAdmin) {
                return res.status(403).json({
                    success: false,
                    error: 'Only super admins can access this route'
                });
            }

            req.user = user;
            next();
        } catch (err) {
            return res.status(401).json({
                success: false,
                error: 'Not authorized to access this route'
            });
        }
    } catch (err) {
        next(err);
    }
};

export { protect, authorize, apiKeyAuth, subscriptionRateLimit, authenticateSuperAdmin };
