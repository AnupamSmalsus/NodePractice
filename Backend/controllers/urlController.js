/**
 * URL Controller
 * Handles all URL-related operations
 */

const Url = require('../models/Url');
const { generateShortCode, validateCustomAlias } = require('../utils/generateShortCode');
const { ApiError } = require('../middlewares/errorHandler');
const geoip = require('geoip-lite');

/**
 * Create a new short URL
 * POST /api/url
 */
const createShortUrl = async (req, res, next) => {
    try {
        const { originalUrl, customAlias, expiresIn } = req.body;
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

        // Check if URL already exists for this user
        const existingUrl = await Url.findOne({ originalUrl, user: req.user._id });
        if (existingUrl && !customAlias) {
            return res.status(200).json({
                success: true,
                message: 'URL already shortened',
                data: {
                    originalUrl: existingUrl.originalUrl,
                    shortUrl: `${baseUrl}/${existingUrl.customAlias || existingUrl.shortCode}`,
                    shortCode: existingUrl.customAlias || existingUrl.shortCode,
                    createdAt: existingUrl.createdAt,
                    expiresAt: existingUrl.expiresAt,
                },
            });
        }

        // Validate custom alias if provided
        if (customAlias) {
            const validation = validateCustomAlias(customAlias);
            if (!validation.isValid) {
                throw new ApiError(400, validation.error);
            }

            // Check if custom alias is already taken
            const aliasExists = await Url.findOne({
                $or: [
                    { customAlias: customAlias.toLowerCase() },
                    { shortCode: customAlias.toLowerCase() }
                ]
            });

            if (aliasExists) {
                throw new ApiError(409, 'Custom alias is already taken');
            }
        }

        // Generate short code
        const shortCode = generateShortCode();

        // Calculate expiration date if provided
        let expiresAt = null;
        if (expiresIn) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
        } else if (process.env.DEFAULT_EXPIRY_DAYS) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.DEFAULT_EXPIRY_DAYS));
        }

        // Create new URL document
        const newUrl = await Url.create({
            originalUrl,
            shortCode,
            customAlias: customAlias ? customAlias.toLowerCase() : null,
            expiresAt,
            user: req.user._id
        });

        // Build the short URL
        const shortUrlCode = customAlias ? customAlias.toLowerCase() : shortCode;
        const shortUrl = `${baseUrl}/${shortUrlCode}`;

        res.status(201).json({
            success: true,
            message: 'Short URL created successfully',
            data: {
                originalUrl: newUrl.originalUrl,
                shortUrl,
                shortCode: shortUrlCode,
                createdAt: newUrl.createdAt,
                expiresAt: newUrl.expiresAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Redirect to original URL and track analytics
 * GET /:shortId
 */
const redirectToOriginal = async (req, res, next) => {
    try {
        const { shortId } = req.params;

        // Find URL by short code or custom alias
        const url = await Url.findByIdentifier(shortId);

        if (!url) {
            throw new ApiError(404, 'Short URL not found');
        }

        // Check if URL has expired
        if (url.isExpired()) {
            throw new ApiError(410, 'Short URL has expired');
        }

        // Detect user type from User-Agent
        const userAgent = req.get('User-Agent') || '';
        let userType = 'unknown';
        if (/mobile/i.test(userAgent)) {
            userType = 'mobile';
        } else if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            userType = 'tablet';
        } else if (/desktop|pc|mac|windows|linux|x11/i.test(userAgent)) {
            userType = 'desktop';
        }

        // Resolve country from IP using geoip-lite
        const ip = (
            req.ip ||
            req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            req.connection?.socket?.remoteAddress
        );
        const geo = geoip.lookup(ip);
        let country = geo ? geo.country : 'Unknown';

        // For local testing, assign a sample country if IP is private/localhost
        if (!country || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            country = 'US'; // Sample country for development
        }

        // Debug logging (remove in production)
        console.log('Visit analytics:', {
            ip,
            userAgent: userAgent.substring(0, 100),
            country,
            userType
        });

        // Increment visit count with analytics
        await url.incrementVisitCount({
            country,
            userType,
            ip,
            userAgent
        });

        // Redirect to original URL
        res.redirect(url.originalUrl);
    } catch (error) {
        next(error);
    }
};

/**
 * Get URL analytics
 * GET /api/url/:shortId
 */
const getUrlAnalytics = async (req, res, next) => {
    try {
        const { shortId } = req.params;

        // Find URL by short code or custom alias
        const url = await Url.findByIdentifier(shortId);

        if (!url) {
            throw new ApiError(404, 'Short URL not found');
        }

        // Ensure the URL belongs to the logged-in user
        if (url.user.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Access denied');
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const shortUrlCode = url.customAlias || url.shortCode;

        res.status(200).json({
            success: true,
            data: {
                originalUrl: url.originalUrl,
                shortUrl: `${baseUrl}/${shortUrlCode}`,
                shortCode: shortUrlCode,
                visitCount: url.visitCount,
                createdAt: url.createdAt,
                expiresAt: url.expiresAt,
                isExpired: url.isExpired(),
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all URLs for the logged-in user
 * GET /api/url/my-urls
 */
const getUserUrls = async (req, res, next) => {
    try {
        const urls = await Url.find({ user: req.user._id }).sort({ createdAt: -1 });
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

        const urlsData = urls.map(url => ({
            _id: url._id,
            originalUrl: url.originalUrl,
            shortUrl: `${baseUrl}/${url.customAlias || url.shortCode}`,
            shortCode: url.customAlias || url.shortCode,
            visitCount: url.visitCount,
            createdAt: url.createdAt,
            expiresAt: url.expiresAt,
            isExpired: url.isExpired(),
        }));

        res.status(200).json({
            success: true,
            data: urlsData,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get detailed analytics for a URL (country and user type breakdown)
 * GET /api/url/:shortId/analytics
 */
const getUrlDetailedAnalytics = async (req, res, next) => {
    try {
        const { shortId } = req.params;
        console.log('Analytics request for shortId:', shortId);

        const url = await Url.findByIdentifier(shortId);
        if (!url) {
            console.log('URL not found for shortId:', shortId);
            throw new ApiError(404, 'Short URL not found');
        }

        if (url.user.toString() !== req.user._id.toString()) {
            throw new ApiError(403, 'Access denied');
        }

        // Aggregate country stats
        const countryStats = url.visits.reduce((acc, visit) => {
            acc[visit.country] = (acc[visit.country] || 0) + 1;
            return acc;
        }, {});

        // Aggregate user type stats
        const userTypeStats = url.visits.reduce((acc, visit) => {
            acc[visit.userType] = (acc[visit.userType] || 0) + 1;
            return acc;
        }, {});

        // Timeline (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const timeline = url.visits
            .filter(v => v.timestamp >= sevenDaysAgo)
            .reduce((acc, visit) => {
                const day = visit.timestamp.toISOString().split('T')[0];
                acc[day] = (acc[day] || 0) + 1;
                return acc;
            }, {});

        res.status(200).json({
            success: true,
            data: {
                shortCode: url.customAlias || url.shortCode,
                totalVisits: url.visitCount,
                countryStats,
                userTypeStats,
                timeline
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get aggregated analytics across all user URLs
 * GET /api/url/aggregated-analytics
 */
const getAggregatedAnalytics = async (req, res, next) => {
    try {
        const urls = await Url.find({ user: req.user._id }).select('visits');
        
        const countryStats = {};
        const userTypeStats = {};

        urls.forEach(url => {
            url.visits.forEach(visit => {
                countryStats[visit.country] = (countryStats[visit.country] || 0) + 1;
                userTypeStats[visit.userType] = (userTypeStats[visit.userType] || 0) + 1;
            });
        });

        res.status(200).json({
            success: true,
            data: {
                countryStats,
                userTypeStats
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createShortUrl,
    redirectToOriginal,
    getUrlAnalytics,
    getUserUrls,
    getUrlDetailedAnalytics,
    getAggregatedAnalytics,
};
