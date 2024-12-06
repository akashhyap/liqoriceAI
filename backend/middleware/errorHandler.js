import logger from '../services/loggerService.js';

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Server Error', {
        error: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });

    // Determine error status code
    const statusCode = err.statusCode || 500;

    // Format error response
    const errorResponse = {
        success: false,
        error: {
            message: process.env.NODE_ENV === 'production' 
                ? 'An error occurred' 
                : err.message,
            code: err.code || 'INTERNAL_SERVER_ERROR',
        },
    };

    // Add stack trace in development
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.error.stack = err.stack;
    }

    // Send error response
    res.status(statusCode).json(errorResponse);
};

// Custom error class
export class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

// Async error handler wrapper
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Not found error handler
export const notFound = (req, res, next) => {
    const err = new AppError(
        `Cannot find ${req.originalUrl} on this server`,
        404,
        'NOT_FOUND'
    );
    next(err);
};

// Rate limit error handler
export const rateLimitHandler = (req, res) => {
    logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.id,
        method: req.method,
        url: req.originalUrl,
    });

    res.status(429).json({
        success: false,
        error: {
            message: 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
        },
    });
};

// Validation error handler
export const validationErrorHandler = (err, req, res, next) => {
    if (err.name === 'ValidationError') {
        logger.error('Validation Error', { error: Object.values(err.errors).map(val => val.message) });
        return res.status(400).json({
            success: false,
            error: Object.values(err.errors).map(val => val.message)
        });
    }
    next(err);
};

// Database error handler
export const databaseErrorHandler = (err, req, res, next) => {
    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        if (err.code === 11000) {
            logger.error('Database Error: Duplicate Key', { error: err.message });
            return res.status(400).json({
                success: false,
                error: 'Duplicate field value entered'
            });
        }
        logger.error('Database error', {
            error: err.message,
            code: err.code,
            userId: req.user?.id,
        });
        return res.status(500).json({
            success: false,
            error: {
                message: 'Database error',
                code: 'DATABASE_ERROR',
            },
        });
    }
    next(err);
};
