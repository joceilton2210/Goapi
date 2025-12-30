import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    logger.error({
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};
