import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
                position: 'fixed',
                top: '1.5rem',
                left: '1.5rem',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000
            }}
            onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.1) rotate(15deg)';
                e.target.style.boxShadow = 'var(--shadow-xl), var(--shadow-glow)';
            }}
            onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1) rotate(0deg)';
                e.target.style.boxShadow = 'var(--shadow-lg)';
            }}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
};

export default ThemeToggle;
