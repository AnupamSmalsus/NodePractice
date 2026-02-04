/**
 * URL Shortener API Server
 * Main entry point for the application
 */

// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { getLogger } = require('./middlewares/logger');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

// Import routes
const urlRoutes = require('./routes/urlRoutes');
const redirectRoute = require('./routes/redirectRoute');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================
// Middleware Stack
// ============================================

// Request logging
app.use(getLogger());

// Enable CORS for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'URL Shortener API is running',
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use('/api/url', urlRoutes);

// Redirect route (must be after API routes to avoid conflicts)
app.use('/', redirectRoute);

// ============================================
// Error Handling
// ============================================

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 URL Shortener API                                    ║
║   ═══════════════════                                     ║
║                                                           ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                           ║
║   Endpoints:                                              ║
║   • POST   /api/url          - Create short URL           ║
║   • GET    /api/url/:shortId - Get URL analytics          ║
║   • GET    /:shortId         - Redirect to original       ║
║   • GET    /health           - Health check               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
