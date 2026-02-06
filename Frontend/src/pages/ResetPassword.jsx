import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const inputRefs = useRef([]);

    const handleOtpChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const newOtp = [...otp];
        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }
        setOtp(newOtp);
        // Focus the next empty input or last input
        const nextEmptyIndex = newOtp.findIndex(digit => !digit);
        inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const otpString = otp.join('');
            await axios.post('http://localhost:3000/api/auth/reset-password', { otp: otpString, password });
            setMessage('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
        setLoading(false);
    };

    const isOtpComplete = otp.every(digit => digit !== '');

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card animate-slideUp" style={{ width: '100%', maxWidth: '450px' }}>
                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>
                    Reset Password
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Enter the 6-digit OTP sent to your email
                </p>

                {message && <div className="success-bg" style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{message}</div>}
                {error && <div className="error-bg error" style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            OTP Code
                        </label>
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center'
                        }}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    style={{
                                        width: '52px',
                                        height: '60px',
                                        textAlign: 'center',
                                        fontSize: '1.75rem',
                                        fontWeight: 'bold',
                                        borderRadius: '12px',
                                        border: digit
                                            ? '2px solid var(--color-primary)'
                                            : '2px solid var(--bg-tertiary)',
                                        background: 'var(--bg-secondary)',
                                        color: 'var(--text-primary)',
                                        outline: 'none',
                                        transition: 'all 0.2s ease',
                                        boxShadow: digit
                                            ? '0 0 0 3px rgba(102, 126, 234, 0.2)'
                                            : 'none'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = 'var(--color-primary)';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        if (!digit) {
                                            e.target.style.borderColor = 'var(--bg-tertiary)';
                                            e.target.style.boxShadow = 'none';
                                        }
                                    }}
                                />
                            ))}
                        </div>
                        <p style={{
                            textAlign: 'center',
                            marginTop: '0.75rem',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)'
                        }}>
                            💡 You can paste the full OTP
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password (min 6 characters)"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginBottom: '1.5rem' }}
                        disabled={loading || !isOtpComplete || password.length < 6}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <span style={{ fontSize: '1.25rem' }}>⏰</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        OTP expires in <strong style={{ color: 'var(--color-primary-light)' }}>10 minutes</strong>
                    </span>
                </div>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Link to="/forgot-password" style={{ color: 'var(--color-primary-light)' }}>Resend OTP</Link>
                    {' · '}
                    <Link to="/login" style={{ color: 'var(--color-primary-light)' }}>Back to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPassword;
