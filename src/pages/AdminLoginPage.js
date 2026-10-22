import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../utils/api';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAdminAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.post('/auth/login', { email, password });

            // Check if user is admin
            if (res.data.user.role !== 'Admin') {
                setError('Access denied. Admin only.');
                setLoading(false);
                return;
            }

            login(res.data.user, res.data.token);
            navigate('/dashboard');

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="adm-login-page">
            <div className="adm-login-card">

                <div className="adm-login-logo">
                    <div className="adm-login-logo-icon">WP</div>
                    <div className="adm-login-logo-text">
                        <div className="adm-login-logo-title">WinzoPay</div>
                        <div className="adm-login-logo-sub">Admin Panel</div>
                    </div>
                </div>

                <h1 className="adm-login-title">Admin Login</h1>
                <p className="adm-login-sub">Enter your admin credentials to continue</p>

                {error && <div className="adm-login-error">⚠️ {error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="adm-login-group">
                        <label className="adm-login-label">Email Address</label>
                        <input
                            type="email"
                            className="adm-login-input"
                            placeholder="admin@winzopay.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="adm-login-group">
                        <label className="adm-login-label">Password</label>
                        <input
                            type="password"
                            className="adm-login-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="adm-login-btn"
                        disabled={loading}
                    >
                        {loading ? '⏳ Signing in...' : '🔐 Sign In to Admin Panel'}
                    </button>
                </form>

                <div className="adm-login-note">
                    ⚠️ This is a secure admin area.<br />
                    Unauthorized access is prohibited.
                </div>

            </div>
        </div>
    );
};

export default AdminLoginPage;