/**
 * URL Validation Middleware
 * Validates incoming URL requests using express-validator
 */

const { body, validationResult } = require('express-validator');

/**
 * Validation rules for creating a short URL
 */
const urlValidationRules = [
    body('originalUrl')
        .trim()
        .notEmpty()
        .withMessage('URL is required')
        .isURL({
            protocols: ['http', 'https'],
            require_protocol: true,
            require_valid_protocol: true,
        })
        .withMessage('Please provide a valid URL with http or https protocol'),

    body('customAlias')
        .optional()
        .trim()
        .isLength({ min: 3, max: 100000 })
        .withMessage('Custom alias must be between 3 and 100000 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Custom alias can only contain letters, numbers, hyphens, and underscores'),

    body('expiresIn')
        .optional()
        .isInt({ min: 1, max: 365 })
        .withMessage('Expiration must be between 1 and 365 days'),
];

/**
 * Middleware to check validation results
 * Returns 400 with errors if validation fails
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }

    next();
};

module.exports = {
    urlValidationRules,
    validate,
};
