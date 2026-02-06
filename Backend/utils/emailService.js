/**
 * Email Service
 * Handles sending emails using Nodemailer
 */

const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Send OTP email for password reset
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @param {string} username - User's username for personalization
 * @returns {Promise<boolean>} - Success status
 */
const sendPasswordResetOTP = async (to, otp, username) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"URL Shortener" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: 'Password Reset OTP - URL Shortener',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">🔗 URL Shortener</h1>
                    </div>
                    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee;">
                        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
                        <p style="color: #666; font-size: 16px;">Hi ${username},</p>
                        <p style="color: #666; font-size: 16px;">We received a request to reset your password. Use the OTP below to proceed:</p>
                        
                        <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 10px; letter-spacing: 8px; margin: 20px 0;">
                            ${otp}
                        </div>
                        
                        <p style="color: #999; font-size: 14px;">⏰ This OTP will expire in <strong>10 minutes</strong>.</p>
                        <p style="color: #999; font-size: 14px;">If you didn't request this, please ignore this email or contact support if you have concerns.</p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center;">
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ OTP email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
        return false;
    }
};

module.exports = {
    sendPasswordResetOTP
};
