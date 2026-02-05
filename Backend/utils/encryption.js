const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'); // Must be 32 bytes (64 hex characters)
const IV_LENGTH = 16;

// Ensure key is Buffer of 32 bytes
const getKey = () => {
    // If provided as hex string in env
    if (process.env.ENCRYPTION_KEY) {
        return Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }
    // Fallback for dev (generates new key on restart, which means old data is lost!)
    // In production, ENCRYPTION_KEY must be fixed in .env
    console.warn('WARNING: Using random encryption key. Data persisted will not be decryptable after restart. Set ENCRYPTION_KEY in .env');
    return Buffer.from(ENCRYPTION_KEY, 'hex');
};

/**
 * Encrypt a text
 * @param {string} text 
 * @returns {string} iv:encryptedText
 */
const encrypt = (text) => {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypt a text
 * @param {string} text iv:encryptedText
 * @returns {string} decryptedText
 */
const decrypt = (text) => {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption failed:', error);
        return null; // Or throw error
    }
};

/**
 * Hash a text (consistent for lookups)
 * @param {string} text 
 * @returns {string} hashedText
 */
const hashIndex = (text) => {
    if (!text) return text;
    return crypto.createHash('sha256').update(text).digest('hex');
};

module.exports = {
    encrypt,
    decrypt,
    hashIndex
};
