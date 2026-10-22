import React, { createContext, useState, useContext, useEffect } from 'react';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('winzopay_admin_token');
        const savedAdmin = localStorage.getItem('winzopay_admin_user');

        if (savedToken && savedAdmin) {
            setToken(savedToken);
            setAdmin(JSON.parse(savedAdmin));
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

    return (
        <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
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