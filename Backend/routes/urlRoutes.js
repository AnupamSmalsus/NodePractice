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
    getUserUrls,
    getUrlDetailedAnalytics,
    getAggregatedAnalytics,
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
 * @route   GET /api/url/my-urls
 * @desc    Get all URLs for the logged-in user
 * @access  Private
 */
router.get('/my-urls', protect, getUserUrls);

/**
 * @route   GET /api/url/aggregated-analytics
 * @desc    Get aggregated analytics across all user URLs
 * @access  Private
 */
router.get('/aggregated-analytics', protect, getAggregatedAnalytics);

/**
 * @route   GET /api/url/:shortId/analytics
 * @desc    Get detailed analytics (country, user type, timeline)
 * @access  Private
 * @params  shortId - The short code or custom alias
 */
router.get('/:shortId/analytics', protect, getUrlDetailedAnalytics);

/**
 * @route   GET /api/url/:shortId
 * @desc    Get URL analytics (original URL, created date, visit count)
 * @access  Private
 * @params  shortId - The short code or custom alias
 */
router.get('/:shortId', protect, getUrlAnalytics);

module.exports = router;
