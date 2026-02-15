import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import ChatBot from '../components/ChatBot';

// API Configuration
const API_BASE_URL = 'http://localhost:3000';

function Home() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [originalUrl, setOriginalUrl] = useState('');
    const [customAlias, setCustomAlias] = useState('');
    const [expiresIn, setExpiresIn] = useState('');

    // UI state
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // History state
    const [history, setHistory] = useState([]);
    const [copiedHistoryId, setCopiedHistoryId] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHistoryItems = history.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(history.length / itemsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    // Track if custom alias was manually edited by user
    const [isAliasManuallyEdited, setIsAliasManuallyEdited] = useState(false);

    // Load user URLs from backend on mount
    useEffect(() => {
        if (user?.token) {
            const fetchUserUrls = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/url/my-urls`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setHistory(data.data);
                    }
                } catch (err) {
                    console.error('Failed to fetch user URLs:', err);
                }
            };
            fetchUserUrls();
        }
    }, [user]);

    // Helper to refresh URLs after creation
    const refreshUrls = async () => {
        if (user?.token) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/url/my-urls`, {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });
                const data = await response.json();
                if (data.success) {
                    setHistory(data.data);
                }
            } catch (err) {
                console.error('Failed to refresh URLs:', err);
            }
        }
    };

    // Auto-generate alias from URL
    const generateAlias = (url) => {
        try {
            if (!url) return '';
            // Remove protocol
            let hostname = url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
            // Remove trailing slash
            hostname = hostname.replace(/\/$/, "");
            // Replace slashes and dots with hyphens
            let alias = hostname.replace(/[\/\.]/g, "-");
            // Remove special characters and keep alphanumeric + hyphens
            alias = alias.replace(/[^a-zA-Z0-9-]/g, "");
            // Remove consecutive hyphens
            alias = alias.replace(/-+/g, "-");
            // Truncate to reasonable length (e.g. 50 chars - matched with backend)
            return alias.slice(0, 50).toLowerCase();
        } catch (e) {
            return '';
        }
    };

    // Handle URL change
    const handleUrlChange = (e) => {
        const val = e.target.value;
        setOriginalUrl(val);

        // Auto-fill alias if user hasn't manually edited it
        if (!isAliasManuallyEdited) {
            const generated = generateAlias(val);
            setCustomAlias(generated);
        }
    };

    // Handle alias change
    const handleAliasChange = (e) => {
        setCustomAlias(e.target.value);
        setIsAliasManuallyEdited(true);
    };

    // Save to history (now just adds to local state; backend is source of truth)
    const saveToHistory = (urlData) => {
        setHistory(prev => [urlData, ...prev]);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        if (!user || !user.token) {
            setError('You must be logged in to create a URL');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    originalUrl,
                    customAlias: customAlias || undefined,
                    expiresIn: expiresIn || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create short URL');
            }

            setResult(data.data);
            await refreshUrls(); // Refresh the list after creation

            // Reset form
            setOriginalUrl('');
            setCustomAlias('');
            setExpiresIn('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Copy to clipboard
    const copyToClipboard = async (text, isHistory = false, id = null) => {
        try {
            await navigator.clipboard.writeText(text);
            if (isHistory) {
                setCopiedHistoryId(id);
                setTimeout(() => setCopiedHistoryId(null), 2000);
            } else {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span className="text-muted">Hello, {user?.username}</span>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Logout</button>
                </div>
                <div className="logo">
                    <div className="logo-icon">🔗</div>
                </div>
                <h1>URL Shortener</h1>
                <p>Transform your long URLs into short, shareable links in seconds</p>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {/* URL Form Card */}
                <div className="card url-form-card">
                    <div className="form-title">
                        <span>✨</span>
                        <h2>Shorten Your URL</h2>
                    </div>

                    <form className="url-form" onSubmit={handleSubmit}>
                        {/* Original URL Input */}
                        <div className="input-group">
                            <label className="input-label">Destination URL</label>
                            <div className="input-with-icon">
                                <span className="input-icon">🌐</span>
                                <input
                                    type="url"
                                    className="input"
                                    placeholder="https://example.com/very/long/url/that/needs/shortening"
                                    value={originalUrl}
                                    onChange={handleUrlChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Custom Alias & Expiry Row */}
                        <div className="form-row">
                            <div className="input-group">
                                <label className="input-label">
                                    Custom Alias
                                    <span className="optional-badge">(optional)</span>
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-icon">🏷️</span>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="my-custom-link"
                                        value={customAlias}
                                        onChange={handleAliasChange}
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label">
                                    Expires In (days)
                                    <span className="optional-badge">(optional)</span>
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-icon">⏰</span>
                                    <input
                                        type="number"
                                        className="input"
                                        placeholder="7"
                                        min="1"
                                        max="365"
                                        value={expiresIn}
                                        onChange={(e) => setExpiresIn(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn btn-primary submit-btn"
                            disabled={loading || !originalUrl}
                        >
                            {loading ? (
                                <>
                                    <div className="loading-spinner"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    ⚡ Shorten URL
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Result Card */}
                {result && (
                    <div className="card result-card success-bg">
                        <div className="result-header">
                            <div className="result-status success">✓</div>
                            <h3>Your short URL is ready!</h3>
                        </div>

                        <div className="short-url-container">
                            <div className="short-url-link">
                                <span className="link-icon">🔗</span>
                                <a href={result.shortUrl} target="_blank" rel="noopener noreferrer">
                                    {result.shortUrl}
                                </a>
                            </div>
                            <button
                                className={`copy-btn ${copied ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(result.shortUrl)}
                            >
                                {copied ? (
                                    <>✓ Copied!</>
                                ) : (
                                    <>📋 Copy</>
                                )}
                            </button>
                        </div>

                        <div className="url-details">
                            <div className="detail-item">
                                <div className="detail-label">Original URL</div>
                                <div className="detail-value truncate" title={result.originalUrl}>
                                    {result.originalUrl}
                                </div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Short Code</div>
                                <div className="detail-value">{result.shortCode}</div>
                            </div>
                            <div className="detail-item">
                                <div className="detail-label">Created</div>
                                <div className="detail-value">{formatDate(result.createdAt)}</div>
                            </div>
                            {result.expiresAt && (
                                <div className="detail-item">
                                    <div className="detail-label">Expires</div>
                                    <div className="detail-value">{formatDate(result.expiresAt)}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Card */}
                {error && (
                    <div className="card result-card error-bg">
                        <div className="result-header">
                            <div className="result-status error">✕</div>
                            <h3>Something went wrong</h3>
                        </div>
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            <p>{error}</p>
                        </div>
                    </div>
                )}
            </main>

            {/* History Section */}
            {history.length > 0 && (
                <section className="history-section">
                    <h2 className="history-title">
                        <span>📜</span>
                        Recent URLs
                    </h2>
                    <div className="history-list">
                        {currentHistoryItems.map((item, index) => (
                            <div key={item.shortCode + index} className="history-item">
                                <div className="history-item-info">
                                    <div className="history-short-url">
                                        <span style={{ opacity: 0.7 }}>#</span>{item.shortCode}
                                    </div>
                                    <div className="history-original-url">{item.originalUrl}</div>
                                </div>
                                <div className="history-item-actions">
                                    <button
                                        className={`action-btn ${copiedHistoryId === item.shortCode ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(item.shortUrl, true, item.shortCode)}
                                        title="Copy URL"
                                    >
                                        {copiedHistoryId === item.shortCode ? '✓' : '📋'}
                                    </button>
                                    <a
                                        href={item.shortUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="action-btn"
                                        title="Open URL"
                                    >
                                        ↗️
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {history.length > itemsPerPage && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                onClick={prevPage}
                                disabled={currentPage === 1}
                            >
                                ←
                            </button>

                            <div className="pagination-numbers">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`pagination-number ${currentPage === i + 1 ? 'active' : ''}`}
                                        onClick={() => paginate(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                className="pagination-btn"
                                onClick={nextPage}
                                disabled={currentPage === totalPages}
                            >
                                →
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Footer */}
            <footer className="footer">
                <p>
                    Built with ❤️ using React & Node.js •
                    <a href="http://localhost:3000/health" target="_blank" rel="noopener noreferrer">
                        {' '}API Status
                    </a>
                    {' '}•
                    <Link to="/profile" style={{ color: 'var(--color-primary-light)' }}>
                        {' '}Edit Profile
                    </Link>
                </p>
            </footer>

            {/* ChatBot */}
            {user && <ChatBot user={user} />}
        </div>
    );
}

export default Home;
