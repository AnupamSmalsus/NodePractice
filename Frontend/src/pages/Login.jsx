import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(identifier, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        const result = await googleLogin(credentialResponse.credential);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    const handleGoogleError = () => {
        setError('Google Sign In was unsuccessful. Please try again.');
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh'
        }}>
            <div className="card animate-slideUp" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 className="text-gradient" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>
                    Welcome Back
                </h2>

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
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1.5rem' }}>
                        Sign In
                    </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Or continue with</p>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            shape="pill"
                            width="100%"
                        />
                    </div>
                </div>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--color-primary-light)' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
