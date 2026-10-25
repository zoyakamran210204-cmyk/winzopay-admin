import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';

// ================================
// User Panel URL (env variable se)
// ================================
const USER_PANEL_URL = process.env.REACT_APP_USER_PANEL_URL || 'http://localhost:3000';

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

    // ================================
    // 🔥 refreshUser — polls /auth/me
    // If admin was demoted → force logout immediately
    // ================================
    const refreshUser = useCallback(async () => {
        const storedToken = localStorage.getItem('winzopay_admin_token');
        if (!storedToken) return;

        try {
            const res = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${storedToken}` }
            });
            const freshUser = res.data.user;

            // 🔥 No longer Admin → kick out & send to User Panel
            if (freshUser.role !== 'Admin') {
                logout();
                // Full URL (works on Vercel)
                window.location.href = `${USER_PANEL_URL}/login`;
                return;
            }

            // 🔥 Frozen / Deactivated → kick out
            if (freshUser.status === 'Frozen' || freshUser.status === 'Deactivated') {
                logout();
                window.location.href = '/login';
                return;
            }

            // Sync fresh admin data
            setAdmin(freshUser);
            localStorage.setItem('winzopay_admin_user', JSON.stringify(freshUser));

        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                window.location.href = '/login';
            }
        }
    }, []);

    // Poll /auth/me every 20 seconds
    useEffect(() => {
        if (!token) return;

        refreshUser();
        const interval = setInterval(refreshUser, 20000);
        return () => clearInterval(interval);
    }, [token, refreshUser]);

    return (
        <AdminAuthContext.Provider
            value={{ admin, token, loading, login, logout, refreshUser }}
        >
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