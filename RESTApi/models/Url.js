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
 * Increment the visit count
 * @returns {Promise} Updated document
 */
urlSchema.methods.incrementVisitCount = async function () {
    this.visitCount += 1;
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
