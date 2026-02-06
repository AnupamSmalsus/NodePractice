import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const api = axios.create({
        baseURL: 'http://localhost:3000/api/auth'
    });

    // Check if user is logged in on mount
    useEffect(() => {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            const parsedUser = JSON.parse(userInfo);
            setUser(parsedUser);
            // Optionally verify token validity here with /me endpoint
        }
        setLoading(false);
    }, []);

    const login = async (identifier, password) => {
        try {
            const { data } = await api.post('/login', { identifier, password });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const signup = async (username, email, password) => {
        try {
            await api.post('/signup', { username, email, password });
            // Don't auto-login, just return success
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Signup failed'
            };
        }
    };

    const googleLogin = async (token) => {
        try {
            const { data } = await api.post('/google', { token });
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Google Sign-in failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    const updateUsername = async (username) => {
        try {
            const token = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')).token : null;
            const { data } = await api.put('/username', { username }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update stored user info
            localStorage.setItem('userInfo', JSON.stringify(data));
            setUser(data);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Update username failed'
            };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, updateUsername, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
