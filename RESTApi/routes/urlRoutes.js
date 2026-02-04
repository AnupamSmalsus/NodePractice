/**
 * URL Routes
 * Defines all URL-related API endpoints
 */

const express = require('express');
const router = express.Router();

const {
    createShortUrl,
    redirectToOriginal,
    getUrlAnalytics,
} = require('../controllers/urlController');

const { urlValidationRules, validate } = require('../middlewares/validateUrl');
const { createUrlLimiter } = require('../middlewares/rateLimiter');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @route   POST /api/url
 * @desc    Create a new short URL
 * @access  Private
 * @body    { originalUrl: string, customAlias?: string, expiresIn?: number }
 */
router.post(
    '/',
    protect,
    createUrlLimiter,
    urlValidationRules,
    validate,
    createShortUrl
);

/**
 * @route   GET /api/url/:shortId
 * @desc    Get URL analytics (original URL, created date, visit count)
 * @access  Private
 * @params  shortId - The short code or custom alias
 */
router.get('/:shortId', protect, getUrlAnalytics);

module.exports = router;
