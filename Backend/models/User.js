const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    // The encrypted email string
    email: {
        type: String,
        required: [true, 'Email is required'],
        // Unique is handled by emailHash, not this field directly as encryption might vary if IV is random
        // However, we want to allow finding by decrypted value ideally, but we'll use emailHash for that.
    },
    // Hashed email for searching/indexing (blind index)
    emailHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Only for google users
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }, // Password not required if googleId is present
        minlength: [6, 'Password must be at least 6 characters long']
    },
    resetPasswordToken: {
        type: String,
        index: true,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
