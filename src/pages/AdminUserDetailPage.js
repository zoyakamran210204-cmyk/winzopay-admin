import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../utils/api';
import './AdminUserDetailPage.css';

const AdminUserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { admin } = useAdminAuth();

    const [user, setUser] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('transactions');
    const [showNewPassword, setShowNewPassword] = useState(null);
    const [copied, setCopied] = useState(false);

    // ================================
    // Load User + Data
    // ================================
    const loadData = async () => {
        try {
            const userRes = await api.get(`/admin/user/${id}`);
            setUser(userRes.data);

            const txRes = await api.get('/admin/transactions');
            setTransactions(txRes.data.filter(t => 
                (t.userId?._id || t.userId) === id
            ));

        } catch (err) {
            console.error('Load failed:', err);
            if (err.response?.status === 404) {
                setMessage({ type: 'error', text: 'User not found' });
            } else if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id, navigate]);

    // ================================
    // Change Status
    // ================================
    const changeStatus = async (newStatus) => {
        if (!window.confirm(`Set this user's status to ${newStatus}?`)) return;

        setActionLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.put('/admin/user/status', { 
                userId: user._id, 
                status: newStatus 
            });
            setUser(res.data.user);
            setMessage({ type: 'success', text: `✅ Status changed to ${newStatus}` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // ================================
    // Make / Remove Admin
    // ================================
    const toggleAdmin = async () => {
        const action = user.role === 'Admin' ? 'remove-admin' : 'make-admin';
        const confirmMsg = user.role === 'Admin'
            ? 'Remove admin privileges?'
            : 'Grant admin privileges?';
        
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.put(`/admin/user/${action}`, { userId: user._id });
            setUser(res.data.user);
            setMessage({ type: 'success', text: res.data.message });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        } finally {
            setActionLoading(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // ================================
    // Reset Password
    // ================================
    const resetPassword = async () => {
        if (!window.confirm('⚠️ This will generate a NEW password. The old password will no longer work. Continue?')) {
            return;
        }

        setActionLoading(true);
        setMessage({ type: '', text: '' });
        setShowNewPassword(null);

        try {
            const res = await api.put('/admin/user/reset-password', { userId: user._id });
            setShowNewPassword(res.data.newPassword);
            setMessage({ 
                type: 'success', 
                text: `✅ Password reset successfully! Copy the new password below.` 
            });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Reset failed' });
        } finally {
            setActionLoading(false);
        }
    };

    // Copy password to clipboard
    const copyPassword = () => {
        navigator.clipboard.writeText(showNewPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Helpers
    const formatDate = (d) => {
        if (!d) return 'N/A';
        return new Date(d).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const isSelf = () => admin?._id === user?._id || admin?.id === user?._id;

    // Filters
    const deposits = transactions.filter(t => t.type === 'Deposit');
    const withdraws = transactions.filter(t => t.type === 'Withdraw');
    const planPurchases = transactions.filter(t => t.type === 'PlanPurchase');
    const planSells = transactions.filter(t => t.type === 'PlanSell');

    const getTabList = () => {
        if (activeTab === 'deposits') return deposits;
        if (activeTab === 'withdraws') return withdraws;
        if (activeTab === 'plans') return planPurchases;
        if (activeTab === 'sells') return planSells;
        return transactions;
    };

    const getTxInfo = (tx) => {
        const map = {
            'Deposit': { icon: '⬇️', label: 'Deposit', cls: 'deposit', sign: '+' },
            'Withdraw': { icon: '⬆️', label: 'Withdrawal', cls: 'withdraw', sign: '-' },
            'PlanPurchase': { icon: '💰', label: 'RP Plan Purchase', cls: 'buy', sign: '-' },
            'PlanSell': { icon: '💱', label: 'RP Sale', cls: 'sell', sign: '+' }
        };
        return map[tx.type] || { icon: '📋', label: tx.type, cls: 'plan', sign: '' };
    };

    const tabs = [
        { key: 'transactions', label: 'All', icon: '📋', count: transactions.length },
        { key: 'deposits', label: 'Deposits', icon: '⬇️', count: deposits.length },
        { key: 'withdraws', label: 'Withdrawals', icon: '⬆️', count: withdraws.length },
        { key: 'plans', label: 'Plans Bought', icon: '💰', count: planPurchases.length },
        { key: 'sells', label: 'RP Sales', icon: '💱', count: planSells.length }
    ];

    if (loading) {
        return (
            <div className="adm-ud-page">
                <AdminHeader />
                <div className="adm-ud-loading">⏳ Loading user profile...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="adm-ud-page">
                <AdminHeader />
                <div className="adm-ud-container">
                    <div className="adm-ud-empty">User not found</div>
                </div>
            </div>
        );
    }

    const currentList = getTabList();

    return (
        <div className="adm-ud-page">
            <AdminHeader />

            <div className="adm-ud-container">

                {/* Breadcrumb */}
                <div className="adm-ud-breadcrumb">
                    <button className="adm-ud-back-btn" onClick={() => navigate('/users')}>
                        ← Back to Users
                    </button>
                    <span>•</span>
                    <span>User Profile</span>
                </div>

                {/* Message */}
                {message.text && (
                    <div className={`adm-ud-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* New Password Modal */}
                {showNewPassword && (
                    <div style={{
                        padding: '20px',
                        background: '#dcfce7',
                        border: '2px solid #16a34a',
                        borderRadius: '14px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: '#166534',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            🔑 New Password Generated (Show Once!)
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'white',
                            padding: '14px 18px',
                            borderRadius: '10px',
                            border: '1px solid #86efac',
                            marginBottom: '12px'
                        }}>
                            <span style={{
                                flex: 1,
                                fontFamily: 'monospace',
                                fontSize: '20px',
                                fontWeight: 800,
                                color: '#166534',
                                letterSpacing: '1.5px'
                            }}>
                                {showNewPassword}
                            </span>
                            <button
                                onClick={copyPassword}
                                style={{
                                    padding: '10px 18px',
                                    background: copied ? '#0f172a' : '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? '✅ Copied!' : '📋 Copy'}
                            </button>
                        </div>

                        <div style={{
                            fontSize: '11px',
                            color: '#166534',
                            fontWeight: 600,
                            lineHeight: 1.5,
                            marginBottom: '12px'
                        }}>
                            ⚠️ Share this password with the user securely (WhatsApp/Phone). It will NOT be shown again. The old password is now invalid.
                        </div>

                        <button
                            onClick={() => setShowNewPassword(null)}
                            style={{
                                padding: '10px 20px',
                                background: '#166534',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            ✓ Done — Hide Password
                        </button>
                    </div>
                )}

                {/* Hero Card */}
                <div className="adm-ud-hero">
                    <div className="adm-ud-hero-left">
                        <div className="adm-ud-hero-avatar">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="adm-ud-hero-info">
                            <div className="adm-ud-hero-name">
                                {user.name}
                                {isSelf() && (
                                    <span style={{
                                        marginLeft: 10,
                                        fontSize: 10,
                                        background: 'rgba(255,255,255,0.15)',
                                        padding: '3px 10px',
                                        borderRadius: 6,
                                        fontWeight: 800
                                    }}>
                                        YOU
                                    </span>
                                )}
                            </div>
                            <div className="adm-ud-hero-meta">
                                <span className="adm-ud-hero-meta-item">📱 {user.mobile}</span>
                                <span className="adm-ud-hero-meta-item">📧 {user.email}</span>
                                <span className="adm-ud-hero-meta-item">
                                    🆔 {user._id.slice(-8).toUpperCase()}
                                </span>
                            </div>
                            <div className="adm-ud-hero-badges">
                                <span className={`adm-ud-hero-badge ${user.status.toLowerCase()}`}>
                                    {user.status}
                                </span>
                                <span className={`adm-ud-hero-badge ${user.role.toLowerCase()}`}>
                                    {user.role}
                                </span>
                                <span className="adm-ud-hero-badge user">
                                    Joined {formatDate(user.createdAt).split(',')[0]}
                                </span>
                            </div>
                        </div>
                    </div>

                    {!isSelf() && (
                        <div className="adm-ud-hero-actions">
                            {user.status !== 'Active' && (
                                <button
                                    className="adm-ud-hero-btn activate"
                                    disabled={actionLoading}
                                    onClick={() => changeStatus('Active')}
                                >
                                    ✅ Activate
                                </button>
                            )}
                            {user.status === 'Active' && (
                                <button
                                    className="adm-ud-hero-btn freeze"
                                    disabled={actionLoading}
                                    onClick={() => changeStatus('Frozen')}
                                >
                                    ❄️ Freeze
                                </button>
                            )}
                            {user.status !== 'Deactivated' && (
                                <button
                                    className="adm-ud-hero-btn deactivate"
                                    disabled={actionLoading}
                                    onClick={() => changeStatus('Deactivated')}
                                >
                                    🚫 Deactivate
                                </button>
                            )}
                            <button
                                className="adm-ud-hero-btn admin"
                                disabled={actionLoading}
                                onClick={toggleAdmin}
                            >
                                {user.role === 'Admin' ? '👤 Remove Admin' : '👑 Make Admin'}
                            </button>
                            <button
                                className="adm-ud-hero-btn"
                                style={{ background: '#7c3aed', color: 'white' }}
                                disabled={actionLoading}
                                onClick={resetPassword}
                            >
                                🔑 Reset Password
                            </button>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="adm-ud-stats">
                    <div className="adm-ud-stat blue">
                        <div className="adm-ud-stat-label">Top-Up Balance</div>
                        <div className="adm-ud-stat-value">
                            R$ {(user.balance || 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="adm-ud-stat purple">
                        <div className="adm-ud-stat-label">Mining Capital</div>
                        <div className="adm-ud-stat-value">
                            R$ {(user.miningCapital || 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="adm-ud-stat orange">
                        <div className="adm-ud-stat-label">RP Balance</div>
                        <div className="adm-ud-stat-value">
                            R$ {(user.rpBalance || 0).toLocaleString()}
                        </div>
                    </div>
                    <div className="adm-ud-stat green">
                        <div className="adm-ud-stat-label">Withdrawable</div>
                        <div className="adm-ud-stat-value green">
                            R$ {(user.withdrawableBalance || 0).toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="adm-ud-grid">
                    {/* Personal Info */}
                    <div className="adm-ud-card">
                        <div className="adm-ud-card-title">👤 Personal Information</div>
                        <div className="adm-ud-info-list">
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Full Name</span>
                                <span className="adm-ud-info-value">{user.name}</span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Email / Mobile</span>
                                <span className="adm-ud-info-value mono">{user.email}</span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Mobile</span>
                                <span className="adm-ud-info-value mono">{user.mobile}</span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Country</span>
                                <span className="adm-ud-info-value">{user.country || 'Brazil'}</span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Currency</span>
                                <span className="adm-ud-info-value">{user.currency || 'BRL'}</span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">User ID</span>
                                <span className="adm-ud-info-value mono">{user._id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Security / IP */}
                    <div className="adm-ud-card">
                        <div className="adm-ud-card-title">🛡️ Security & Tracking</div>
                        <div className="adm-ud-info-list">
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">IP Address</span>
                                <span className="adm-ud-info-value ip">
                                    {user.ipAddress || 'N/A'}
                                </span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Status</span>
                                <span className={`adm-ud-status ${user.status.toLowerCase()}`}>
                                    {user.status}
                                </span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Role</span>
                                <span className={`adm-ud-status ${user.role === 'Admin' ? 'active' : 'pending'}`}>
                                    {user.role}
                                </span>
                            </div>
                            <div className="adm-ud-info-item">
                                <span className="adm-ud-info-label">Account Created</span>
                                <span className="adm-ud-info-value">
                                    {formatDate(user.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Tabs */}
                <div className="adm-ud-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`adm-ud-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            <span className="adm-ud-tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Activity List */}
                {currentList.length === 0 ? (
                    <div className="adm-ud-empty">
                        No {activeTab === 'all' || activeTab === 'transactions' ? 'activity' : activeTab} records found
                    </div>
                ) : (
                    <div className="adm-ud-list">
                        {currentList.map(tx => {
                            const info = getTxInfo(tx);
                            return (
                                <div key={tx._id} className="adm-ud-list-item">
                                    <div className={`adm-ud-list-icon ${info.cls}`}>
                                        {info.icon}
                                    </div>
                                    <div className="adm-ud-list-content">
                                        <div className="adm-ud-list-title">
                                            {info.label}
                                            {tx.planName && ` • Plan ${tx.planName}`}
                                        </div>
                                        <div className="adm-ud-list-sub">
                                            <span>{formatDate(tx.createdAt)}</span>
                                            {tx.cryptoType && <span>• {tx.cryptoType}</span>}
                                            <span className={`adm-ud-status ${tx.status.toLowerCase()}`}>
                                                {tx.status}
                                            </span>
                                        </div>

                                        {/* Bank Details (for Withdraw) */}
                                        {tx.type === 'Withdraw' && tx.bankDetails?.bankCode && (
                                            <div className="adm-ud-bank-card">
                                                <div className="adm-ud-bank-title">🏦 Bank Details</div>
                                                <div className="adm-ud-bank-grid">
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label">Bank</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.bankDetails.bankName}
                                                        </span>
                                                    </div>
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label">Holder</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.bankDetails.accountHolderName}
                                                        </span>
                                                    </div>
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label">Account No.</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.bankDetails.accountNumber}
                                                        </span>
                                                    </div>
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label">CPF</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.bankDetails.cpfCnpj}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* PIX Details */}
                                        {tx.type === 'Withdraw' && tx.pixDetails?.pixKey && (
                                            <div className="adm-ud-bank-card" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                                                <div className="adm-ud-bank-title" style={{ color: '#166534' }}>
                                                    📱 PIX Details
                                                </div>
                                                <div className="adm-ud-bank-grid">
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label" style={{ color: '#166534' }}>Key Type</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.pixDetails.pixKeyType}
                                                        </span>
                                                    </div>
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label" style={{ color: '#166534' }}>PIX Key</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.pixDetails.pixKey}
                                                        </span>
                                                    </div>
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label" style={{ color: '#166534' }}>Holder</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.pixDetails.accountHolderName}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* USDT Details */}
                                        {tx.type === 'Withdraw' && tx.cryptoDetails?.walletAddress && (
                                            <div className="adm-ud-bank-card" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
                                                <div className="adm-ud-bank-title" style={{ color: '#92400e' }}>
                                                    🪙 USDT Wallet
                                                </div>
                                                <div className="adm-ud-bank-grid">
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label" style={{ color: '#92400e' }}>Network</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.cryptoDetails.network}
                                                        </span>
                                                    </div>
                                                    <div className="adm-ud-bank-item">
                                                        <span className="adm-ud-bank-label" style={{ color: '#92400e' }}>Wallet</span>
                                                        <span className="adm-ud-bank-value">
                                                            {tx.cryptoDetails.walletAddress}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`adm-ud-list-amount ${info.sign === '+' ? 'positive' : 'negative'}`}>
                                        {info.sign} R$ {tx.amount.toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminUserDetailPage;