/**
 * Logging Middleware
 * HTTP request logging using Morgan
 */

const morgan = require('morgan');

// Custom token for response time in ms
morgan.token('response-time-ms', (req, res) => {
    if (!req._startAt || !res._startAt) return '';
    const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
        (res._startAt[1] - req._startAt[1]) * 1e-6;
    return ms.toFixed(2);
});

// Custom log format
const customFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

/**
 * Development logger - colored output with detailed info
 */
const devLogger = morgan('dev');

/**
 * Production logger - combined format for log aggregation
 */
const prodLogger = morgan('combined');

/**
 * Custom logger with timestamp
 */
const customLogger = morgan(customFormat);

/**
 * Get appropriate logger based on environment
 * @returns {Function} Morgan middleware
 */
const getLogger = () => {
    const env = process.env.NODE_ENV || 'development';

    if (env === 'production') {
        return prodLogger;
    }

    return devLogger;
};

module.exports = {
    devLogger,
    prodLogger,
    customLogger,
    getLogger,
};
