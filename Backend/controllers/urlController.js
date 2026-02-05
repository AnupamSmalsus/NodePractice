/**
 * URL Controller
 * Handles all URL-related operations
 */

const Url = require('../models/Url');
const { generateShortCode, validateCustomAlias } = require('../utils/generateShortCode');
const { ApiError } = require('../middlewares/errorHandler');

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
 * Redirect to original URL
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
            throw new ApiError(410, 'This short URL has expired');
        }

        // Increment visit count asynchronously (don't wait for it)
        url.incrementVisitCount().catch(err => {
            console.error('Failed to increment visit count:', err);
        });

        // Redirect to original URL
        res.redirect(302, url.originalUrl);
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

module.exports = {
    createShortUrl,
    redirectToOriginal,
    getUrlAnalytics,
};
