const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getMe,
  googleLogin,
  updateUsername,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/username', protect, updateUsername);

module.exports = router;
