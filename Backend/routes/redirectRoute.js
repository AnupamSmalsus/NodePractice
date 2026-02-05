/**
 * Redirect Route
 * Handles short URL redirections
 */

const express = require('express');
const router = express.Router();

const { redirectToOriginal } = require('../controllers/urlController');

/**
 * @route   GET /:shortId
 * @desc    Redirect to original URL and increment visit count
 * @access  Public
 * @params  shortId - The short code or custom alias
 */
router.get('/:shortId', redirectToOriginal);

module.exports = router;
