/**
 * URL Model
 * Mongoose schema for storing shortened URLs
 */

const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    // The original long URL
    originalUrl: {
        type: String,
        required: [true, 'Original URL is required'],
        trim: true,
    },

    // Generated short code (e.g., 'abc123')
    shortCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    // Optional custom alias provided by user
    customAlias: {
        type: String,
        unique: true,
        sparse: true, // Allows null values while maintaining uniqueness
        trim: true,
        lowercase: true,
    },

    // Number of times the short URL has been visited
    visitCount: {
        type: Number,
        default: 0,
    },

    // Timestamp when the URL was created
    createdAt: {
        type: Date,
        default: Date.now,
    },

    // Optional expiration date for the short URL
    expiresAt: {
        type: Date,
        default: null,
    },

    // Reference to the user who created the URL
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Analytics: array of visits with metadata
    visits: [{
        timestamp: { type: Date, default: Date.now },
        country: { type: String, default: 'Unknown' },
        userType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
        ip: { type: String },
        userAgent: { type: String }
    }]
});

// Compound index for faster lookups
urlSchema.index({ shortCode: 1, customAlias: 1 });

// Index for finding expired URLs (useful for cleanup jobs)
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Check if the URL has expired
 * @returns {boolean} True if expired, false otherwise
 */
urlSchema.methods.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

/**
 * Increment the visit count and record analytics
 * @param {Object} analytics - { country, userType, ip, userAgent }
 * @returns {Promise} Updated document
 */
urlSchema.methods.incrementVisitCount = async function (analytics = {}) {
    this.visitCount += 1;
    this.visits.push({
        timestamp: new Date(),
        country: analytics.country || 'Unknown',
        userType: analytics.userType || 'unknown',
        ip: analytics.ip,
        userAgent: analytics.userAgent
    });
    return this.save();
};

/**
 * Static method to find URL by short code or custom alias
 * @param {string} identifier - Short code or custom alias
 * @returns {Promise} URL document or null
 */
urlSchema.statics.findByIdentifier = async function (identifier) {
    return this.findOne({
        $or: [
            { shortCode: identifier },
            { customAlias: identifier }
        ]
    });
};

const Url = mongoose.model('Url', urlSchema);

module.exports = Url;
