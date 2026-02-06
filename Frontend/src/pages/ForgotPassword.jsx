import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const { data } = await axios.post('http://localhost:3000/api/auth/forgot-password', { email });
            setMessage(data.message + ' Redirecting to OTP verification...');
            // Redirect to reset password page after 2 seconds
            setTimeout(() => navigate('/reset-password'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
        setLoading(false);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="card animate-slideUp" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>
                    Forgot Password
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Enter your email to receive a 6-digit OTP
                </p>

                {message && <div className="success-bg" style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{message}</div>}
                {error && <div className="error-bg error" style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            className="input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            disabled={loading || message}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={loading || message}>
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Already have an OTP?{' '}
                    <Link to="/reset-password" style={{ color: 'var(--color-primary-light)' }}>Enter OTP</Link>
                    {' · '}
                    <Link to="/login" style={{ color: 'var(--color-primary-light)' }}>Back to Login</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;
