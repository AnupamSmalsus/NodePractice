/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per IP address
 */

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Default: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: 'Please wait 15 minutes before making more requests.',
    },
    standardHeaders: true, // Return rate limit info in headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    handler: (req, res, next, options) => {
        res.status(429).json(options.message);
    },
});

/**
 * Stricter rate limiter for URL creation
 * 20 requests per 15 minutes to prevent spam
 */
const createUrlLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: {
        success: false,
        message: 'Too many URLs created. Please try again later.',
        retryAfter: 'Please wait 15 minutes before creating more URLs.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        res.status(429).json(options.message);
    },
});

module.exports = {
    apiLimiter,
    createUrlLimiter,
};
