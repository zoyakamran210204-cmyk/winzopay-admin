import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import './AdminHeader.css';

const AdminHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { admin, logout } = useAdminAuth();

    const navItems = [
        { key: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
        { key: 'users', label: 'Users', icon: '👥', path: '/users' },
        { key: 'transactions', label: 'Transactions', icon: '💳', path: '/transactions', badge: '!' },
        { key: 'payment-settings', label: 'Payment', icon: '💰', path: '/payment-settings' }
    ];

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/');
        }
    };

    return (
        <header className="adm-header">

            {/* Left - Logo + Nav */}
            <div className="adm-header-left">
                <div className="adm-logo" onClick={() => navigate('/dashboard')}>
                    <div className="adm-logo-icon">WP</div>
                    <div className="adm-logo-text">
                        <div className="adm-logo-title">WinzoPay</div>
                        <div className="adm-logo-sub">Admin Panel</div>
                    </div>
                </div>

                <nav className="adm-nav">
                    {navItems.map(item => (
                        <button
                            key={item.key}
                            className={`adm-nav-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                            {item.badge && (
                                <span className="adm-nav-badge">{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Right - Admin Info + Logout */}
            <div className="adm-header-right">
                <div className="adm-admin-info">
                    <div className="adm-admin-avatar">
                        {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div className="adm-admin-details">
                        <div className="adm-admin-name">{admin?.name || 'Admin'}</div>
                        <div className="adm-admin-role">Administrator</div>
                    </div>
                </div>

                <button className="adm-logout-btn" onClick={handleLogout}>
                    ⏻ Logout
                </button>
            </div>

        </header>
    );
};

export default AdminHeader;