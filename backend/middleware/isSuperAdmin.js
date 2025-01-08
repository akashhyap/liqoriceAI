import ErrorResponse from '../utils/errorResponse.js';

const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        return next(new ErrorResponse('Not authorized to access this route', 403));
    }
};

export default isSuperAdmin;
