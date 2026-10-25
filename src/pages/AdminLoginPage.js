import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../utils/api';
import './AdminLoginPage.css';

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAdminAuth();

    const [loginMethod, setLoginMethod] = useState('email'); // 'email' ya 'mobile'
    const [email, setEmail] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Payload banate hain (agar email select hai to email, warna mobile)
            const payload = loginMethod === 'email' 
                ? { email, password } 
                : { mobile, password };

            const res = await api.post('/auth/login', payload);

            // Role check
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

                {/* 👈 Email / Mobile Toggle */}
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '5px', borderRadius: '10px', marginBottom: '20px' }}>
                    <button
                        type="button"
                        onClick={() => { setLoginMethod('email'); setError(''); }}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer',
                            background: loginMethod === 'email' ? 'white' : 'transparent',
                            boxShadow: loginMethod === 'email' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                            color: loginMethod === 'email' ? '#0f172a' : '#64748b'
                        }}
                    >
                        📧 Email
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLoginMethod('mobile'); setError(''); }}
                        style={{
                            flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer',
                            background: loginMethod === 'mobile' ? 'white' : 'transparent',
                            boxShadow: loginMethod === 'mobile' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                            color: loginMethod === 'mobile' ? '#0f172a' : '#64748b'
                        }}
                    >
                        📱 Mobile
                    </button>
                </div>

                {error && <div className="adm-login-error">⚠️ {error}</div>}

                <form onSubmit={handleLogin}>
                    {loginMethod === 'email' ? (
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
                    ) : (
                        <div className="adm-login-group">
                            <label className="adm-login-label">Mobile Number</label>
                            <input
                                type="tel"
                                className="adm-login-input"
                                placeholder="e.g. 55555555"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                required
                            />
                        </div>
                    )}

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

                    <button type="submit" className="adm-login-btn" disabled={loading}>
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