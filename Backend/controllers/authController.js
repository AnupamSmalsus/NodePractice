const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt, hashIndex } = require('../utils/encryption');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const { sendPasswordResetOTP } = require('../utils/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

// Helper: Format user response (decrypt email)
const formatUserResponse = (user) => {
    return {
        _id: user._id,
        username: user.username,
        email: decrypt(user.email),
        token: generateToken(user._id)
    };
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validations
        if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
            return res.status(400).json({ message: 'Please use a valid email address' });
        }

        // Normalize email to lowercase
        const emailLower = email.toLowerCase();
        const hashedEmail = hashIndex(emailLower);
        const encryptedEmail = encrypt(emailLower);

        // Check if user exists (by email hash or username)
        const userExists = await User.findOne({
            $or: [
                { emailHash: hashedEmail },
                { username }
            ]
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            username,
            email: encryptedEmail,
            emailHash: hashedEmail,
            password
        });

        if (user) {
            res.status(201).json(formatUserResponse(user));
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        // Accept identifier (email or username)
        const { identifier, password } = req.body;

        let user;
        const isEmail = identifier.includes('@');

        if (isEmail) {
            // If it looks like an email, search by emailHash
            const hashedEmail = hashIndex(identifier.toLowerCase());
            user = await User.findOne({ emailHash: hashedEmail });
        } else {
            // Otherwise search by username
            user = await User.findOne({ username: identifier });
        }

        if (user && (await user.comparePassword(password))) {
            res.json(formatUserResponse(user));
        } else {
            // Generic error message
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Google Sign In
// @route   POST /api/auth/google
// @access  Public
exports.googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        // Verify token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const { email, name, sub: googleId } = ticket.getPayload();

        if (!email) {
            return res.status(400).json({ message: 'Email not found in Google token' });
        }

        const hashedEmail = hashIndex(email);

        // Check if user exists
        let user = await User.findOne({ emailHash: hashedEmail });

        if (user) {
            // User exists, update googleId if not present (merge acct)
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
            return res.json(formatUserResponse(user));
        }

        // Create new user using Google info
        const encryptedEmail = encrypt(email);
        let username = name.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).slice(-4);

        // Ensure username is unique
        while (await User.findOne({ username })) {
            username = name.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).slice(-4);
        }

        user = await User.create({
            username,
            email: encryptedEmail,
            emailHash: hashedEmail,
            googleId,
            password: crypto.randomBytes(16).toString('hex') // Dummy password
        });

        res.status(201).json(formatUserResponse(user));

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(401).json({ message: 'Google authentication failed', error: error.message });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        // Decrypt email before sending
        const userData = user.toObject();
        userData.email = decrypt(user.email);

        res.status(200).json(userData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update logged-in user's username
// @route   PUT /api/auth/username
// @access  Private
exports.updateUsername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || typeof username !== 'string' || username.trim().length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters long' });
        }

        const usernameTrimmed = username.trim();

        const existing = await User.findOne({
            username: usernameTrimmed,
            _id: { $ne: req.user.id }
        });

        if (existing) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.username = usernameTrimmed;
        await user.save();

        res.status(200).json(formatUserResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Request password reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
            return res.status(400).json({ message: 'Please use a valid email address' });
        }

        const emailLower = email.toLowerCase();
        const emailHash = hashIndex(emailLower);

        const user = await User.findOne({ emailHash });

        // Always return success to avoid user enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'If that email exists, an OTP has been sent' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        user.resetPasswordToken = otpHash;
        user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send OTP via email
        const decryptedEmail = decrypt(user.email);
        const emailSent = await sendPasswordResetOTP(decryptedEmail, otp, user.username);

        if (!emailSent) {
            return res.status(500).json({ success: false, message: 'Failed to send OTP email. Please try again.' });
        }

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email address'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { otp, password } = req.body;

        if (!otp || typeof otp !== 'string' || otp.length !== 6) {
            return res.status(400).json({ message: 'Please provide a valid 6-digit OTP' });
        }

        if (!password || typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: otpHash,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.password = password;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json(formatUserResponse(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
