import config from '../config/default.js';
import logger from '../utils/logger.js';

export const authMiddleware = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
        logger.warn('Request without API key');
        return res.status(401).json({
            success: false,
            message: 'API key is required'
        });
    }
    
    if (apiKey !== config.apiKey) {
        logger.warn(`Invalid API key attempt: ${apiKey}`);
        return res.status(403).json({
            success: false,
            message: 'Invalid API key'
        });
    }
    
    next();
};
