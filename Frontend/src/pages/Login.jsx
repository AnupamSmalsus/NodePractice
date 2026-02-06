import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(identifier, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setLoading(true);
        const result = await googleLogin(credentialResponse.credential);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleGoogleError = () => {
        setError('Google Sign In was unsuccessful. Please try again.');
    };

    const features = [
        { icon: '⚡', title: 'Lightning Fast', desc: 'Create short URLs in milliseconds' },
        { icon: '📊', title: 'Analytics', desc: 'Track clicks and visitor data' },
        { icon: '🎨', title: 'Custom Aliases', desc: 'Create memorable branded links' },
        { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' },
    ];

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            width: '100%'
        }}>
            {/* Left Side - App Info */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '3rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background decoration */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle at 30% 70%, rgba(102, 126, 234, 0.1) 0%, transparent 50%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1, maxWidth: '500px' }}>
                    {/* Logo/Brand */}
                    <div style={{ marginBottom: '2rem' }}>
                        <span style={{ fontSize: '3rem' }}>🔗</span>
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginTop: '0.5rem'
                        }}>
                            URL Shortener
                        </h1>
                    </div>

                    {/* Tagline */}
                    <p style={{
                        fontSize: '1.25rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        marginBottom: '2.5rem'
                    }}>
                        Transform long, ugly URLs into short, memorable links.
                        Track performance, analyze traffic, and share with confidence.
                    </p>

                    {/* Features Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1.25rem'
                    }}>
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '12px',
                                    padding: '1.25rem',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>
                                    {feature.icon}
                                </span>
                                <h3 style={{
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.25rem'
                                }}>
                                    {feature.title}
                                </h3>
                                <p style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-muted)',
                                    margin: 0
                                }}>
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Stats */}
                    <div style={{
                        display: 'flex',
                        gap: '2rem',
                        marginTop: '2.5rem',
                        paddingTop: '2rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary-light)' }}>10K+</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>URLs Created</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary-light)' }}>50K+</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Clicks Tracked</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--color-primary-light)' }}>99.9%</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Uptime</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '2rem',
                background: 'var(--bg-primary)'
            }}>
                <div className="card animate-slideUp" style={{ width: '100%', maxWidth: '420px' }}>
                    <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2rem' }}>
                        Welcome Back
                    </h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Sign in to manage your short URLs
                    </p>

                    {error && <div className="error-bg error" style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email or Username</label>
                            <input
                                type="text"
                                className="input"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="Enter your email or username"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div style={{ marginBottom: '0.75rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                            <input
                                type="password"
                                className="input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div style={{ textAlign: 'right', marginBottom: '1.5rem' }}>
                            <Link to="/forgot-password" style={{ color: 'var(--color-primary-light)', fontSize: '0.9rem' }}>
                                Forgot password?
                            </Link>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>or continue with</span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    </div>

                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                        />
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/signup" style={{ color: 'var(--color-primary-light)', fontWeight: '500' }}>
                            Create one for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
