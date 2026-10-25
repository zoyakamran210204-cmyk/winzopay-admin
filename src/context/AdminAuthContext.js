import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';

// User Panel URL
const USER_PANEL_URL = process.env.REACT_APP_USER_PANEL_URL || 'https://winzopay-frontend.vercel.app';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('winzopay_admin_token');
        const savedAdmin = localStorage.getItem('winzopay_admin_user');

        if (savedToken && savedAdmin) {
            try {
                setToken(savedToken);
                setAdmin(JSON.parse(savedAdmin));
            } catch (err) {
                localStorage.removeItem('winzopay_admin_token');
                localStorage.removeItem('winzopay_admin_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (adminData, adminToken) => {
        setAdmin(adminData);
        setToken(adminToken);
        localStorage.setItem('winzopay_admin_token', adminToken);
        localStorage.setItem('winzopay_admin_user', JSON.stringify(adminData));
    };

    const logout = () => {
        setAdmin(null);
        setToken(null);
        localStorage.removeItem('winzopay_admin_token');
        localStorage.removeItem('winzopay_admin_user');
    };

    // 🔥 Polling function
    const refreshUser = useCallback(async () => {
        const storedToken = localStorage.getItem('winzopay_admin_token');
        if (!storedToken) return;

        try {
            const res = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${storedToken}` }
            });
            const freshUser = res.data.user;

            // Instant redirect if demoted to User
            if (freshUser.role !== 'Admin') {
                logout();
                window.location.href = `${USER_PANEL_URL}/`; 
                return;
            }

            if (freshUser.status === 'Frozen' || freshUser.status === 'Deactivated') {
                logout();
                window.location.href = '/';
                return;
            }

            setAdmin(freshUser);
            localStorage.setItem('winzopay_admin_user', JSON.stringify(freshUser));
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                window.location.href = '/';
            }
        }
    }, []);

    // 🔥 Polling har 3 second mein
    useEffect(() => {
        if (!token) return;
        refreshUser();
        const interval = setInterval(refreshUser, 3000); 
        return () => clearInterval(interval);
    }, [token, refreshUser]);

    return (
        <AdminAuthContext.Provider value={{ admin, token, loading, login, logout, refreshUser }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
    return context;
};

export default AdminAuthContext;