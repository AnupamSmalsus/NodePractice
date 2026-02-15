import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ChatBot = ({ user }) => {
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hi! I can help you with URL analytics. Ask me things like:\n- "How many clicks did abc123 get?"\n- "Which countries visited my links?"\n- "What devices were used?"' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const detectShortCode = (text, userUrls) => {
        // Extract all potential words
        const words = text.match(/\b[a-zA-Z0-9-]{3,}\b/g) || [];
        const validShortCodes = new Set(userUrls.map(url => url.shortCode));
        
        for (const word of words) {
            if (validShortCodes.has(word)) {
                return word;
            }
        }
        return null;
    };

    const handleSend = async () => {
        if (!input.trim() || !user?.token) return;

        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const question = input.toLowerCase();
            console.log('Question:', question);
            
            // Fetch all user URLs to validate short codes
            const urlsResponse = await axios.get(`${API_BASE_URL}/api/url/my-urls`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const userUrls = urlsResponse.data.data;
            const shortCode = detectShortCode(input, userUrls);
            console.log('Detected shortCode:', shortCode);

            if (shortCode) {
                console.log('Using specific URL analytics');
                // Detailed analytics for a specific short URL
                const response = await axios.get(`${API_BASE_URL}/api/url/${shortCode}/analytics`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = response.data.data;
                const botReply = generateReply(question, data);
                setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
            } else if (question.includes('countr') || question.includes('device') || question.includes('mobile') || question.includes('desktop') || question.includes('tablet')) {
                console.log('Using aggregated analytics');
                // Aggregated analytics for country/device questions
                const response = await axios.get(`${API_BASE_URL}/api/url/aggregated-analytics`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const data = response.data.data;
                const botReply = generateAggregatedReply(question, data);
                setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
            } else {
                console.log('Using general analytics');
                // General analytics across all URLs
                const botReply = generateGeneralReply(question, userUrls);
                setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);
            }
        } catch (err) {
            setMessages(prev => [
                ...prev,
                { sender: 'bot', text: `Error: ${err.response?.data?.message || 'Failed to fetch analytics'}` }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const generateAggregatedReply = (question, data) => {
        const { countryStats, userTypeStats } = data;
        console.log('Aggregated analytics data:', data);

        if (question.includes('country') || question.includes('countries')) {
            const topCountries = Object.entries(countryStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([c, cnt]) => `${c}: ${cnt}`)
                .join(', ');
            return `Visits by country across all your URLs:\n${topCountries || 'No visits recorded yet.'}`;
        }

        if (question.includes('device') || question.includes('mobile') || question.includes('desktop') || question.includes('tablet')) {
            const devices = Object.entries(userTypeStats)
                .map(([type, cnt]) => `${type}: ${cnt}`)
                .join(', ');
            return `Device breakdown across all your URLs:\n${devices}`;
        }

        return `Here\'s the aggregated data across all your URLs:\n- Countries: ${Object.keys(countryStats).length}\n- Devices: ${Object.keys(userTypeStats).length}`;
    };

    const generateGeneralReply = (question, urls) => {
        if (urls.length === 0) {
            return 'You haven\'t created any short URLs yet.';
        }

        const totalClicks = urls.reduce((sum, url) => sum + (url.visitCount || 0), 0);
        const topUrl = urls.reduce((best, url) => (url.visitCount || 0) > (best.visitCount || 0) ? url : best);

        if (question.includes('how many') || question.includes('clicks') || question.includes('visits')) {
            return `Your short URLs have received **${totalClicks}** total clicks across ${urls.length} links.`;
        }

        if (question.includes('top') || question.includes('best') || question.includes('most')) {
            return `Your most popular link is **${topUrl.shortCode}** with **${topUrl.visitCount || 0}** clicks.`;
        }

        // Default summary
        return `You have ${urls.length} short URLs with a total of ${totalClicks} clicks. Your top performer is ${topUrl.shortCode} (${topUrl.visitCount || 0} clicks).`;
    };

    const generateReply = (question, data) => {
        const { totalVisits, countryStats, userTypeStats, timeline } = data;

        if (question.includes('how many') || question.includes('clicks') || question.includes('visits')) {
            return `The short URL "${data.shortCode}" has received **${totalVisits}** total clicks.`;
        }

        if (question.includes('country') || question.includes('countries')) {
            const topCountries = Object.entries(countryStats)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([c, cnt]) => `${c}: ${cnt}`)
                .join(', ');
            return `Visits by country:\n${topCountries}`;
        }

        if (question.includes('device') || question.includes('mobile') || question.includes('desktop') || question.includes('tablet')) {
            const devices = Object.entries(userTypeStats)
                .map(([type, cnt]) => `${type}: ${cnt}`)
                .join(', ');
            return `Device breakdown:\n${devices}`;
        }

        if (question.includes('today') || question.includes('recent') || question.includes('last')) {
            const today = new Date().toISOString().split('T')[0];
            const todayVisits = timeline[today] || 0;
            return `Today: ${todayVisits} visits.\nLast 7 days: ${Object.values(timeline).reduce((a, b) => a + b, 0)} visits.`;
        }

        // Default summary
        return `Here\'s a quick summary for "${data.shortCode}":\n- Total clicks: ${totalVisits}\n- Top countries: ${Object.entries(countryStats).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}\n- Main device: ${Object.entries(userTypeStats).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A'}`;
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '320px',
            height: '450px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000
        }}>
            <div style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                fontWeight: 'bold',
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span>Analytics Assistant</span>
            </div>

            <div style={{
                flex: 1,
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: msg.sender === 'user' ? 'var(--color-primary-light)' : 'var(--bg-primary)',
                            color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.9rem'
                        }}
                    >
                        {msg.text}
                    </div>
                ))}
                {loading && (
                    <div style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-muted)',
                        alignSelf: 'flex-start',
                        maxWidth: '85%',
                        fontSize: '0.9rem'
                    }}>
                        Typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{
                padding: '12px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                gap: '8px'
            }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about analytics..."
                    style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--color-primary-light)',
                        color: 'white',
                        cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                        opacity: loading || !input.trim() ? 0.6 : 1,
                        fontSize: '0.9rem'
                    }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatBot;
