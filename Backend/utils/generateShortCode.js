/**
 * Short Code Generator Utility
 * Generates unique short codes for URLs using nanoid
 */

const { nanoid } = require('nanoid');

// Default length for short codes (7 characters provides ~64^7 = 4 trillion combinations)
const DEFAULT_CODE_LENGTH = 7;

/**
 * Generate a unique short code
 * @param {number} length - Length of the short code (default: 7)
 * @returns {string} A unique short code
 */
const generateShortCode = (length = DEFAULT_CODE_LENGTH) => {
    return nanoid(length);
};

/**
 * Validate a custom alias
 * @param {string} alias - The custom alias to validate
 * @returns {object} { isValid: boolean, error: string|null }
 */
const validateCustomAlias = (alias) => {
    // Check length (3-50 characters)
    if (alias.length < 3 || alias.length > 50) {
        return {
            isValid: false,
            error: 'Custom alias must be between 3 and 50 characters',
        };
    }

    // Only allow alphanumeric characters, hyphens, and underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(alias)) {
        return {
            isValid: false,
            error: 'Custom alias can only contain letters, numbers, hyphens, and underscores',
        };
    }

    return { isValid: true, error: null };
};

module.exports = {
    generateShortCode,
    validateCustomAlias,
};
