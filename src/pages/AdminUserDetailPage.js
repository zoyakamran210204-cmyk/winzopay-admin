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

    // ⚠️ NAYA: Add Balance States
    const [showAddBalance, setShowAddBalance] = useState(false);
    const [balanceForm, setBalanceForm] = useState({ amount: '', balanceType: 'balance' });
    const [balanceLoading, setBalanceLoading] = useState(false);

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
        if (!window.confirm('⚠️ This will generate a NEW password. Continue?')) return;

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

    const copyPassword = () => {
        navigator.clipboard.writeText(showNewPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ⚠️ NAYA: Handle Add Balance
    const handleAddBalance = async (e) => {
        e.preventDefault();
        setBalanceLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.put('/admin/user/add-balance', {
                userId: user._id,
                amount: Number(balanceForm.amount),
                balanceType: balanceForm.balanceType
            });

            setUser({ ...user, ...res.data.user });
            setMessage({ type: 'success', text: `✅ ${res.data.message}` });
            setShowAddBalance(false);
            setBalanceForm({ amount: '', balanceType: 'balance' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add balance' });
        } finally {
            setBalanceLoading(false);
        }
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
                <div className="adm-ud-breadcrumb">
                    <button className="adm-ud-back-btn" onClick={() => navigate('/users')}>
                        ← Back to Users
                    </button>
                    <span>•</span>
                    <span>User Profile</span>
                </div>

                {message.text && (
                    <div className={`adm-ud-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {showNewPassword && (
                    <div style={{
                        padding: '20px', background: '#dcfce7', border: '2px solid #16a34a',
                        borderRadius: '14px', marginBottom: '20px'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#166534', marginBottom: '12px' }}>
                            🔑 New Password Generated (Show Once!)
                        </div>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            background: 'white', padding: '14px 18px', borderRadius: '10px',
                            border: '1px solid #86efac', marginBottom: '12px'
                        }}>
                            <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '20px', fontWeight: 800, color: '#166534' }}>
                                {showNewPassword}
                            </span>
                            <button onClick={copyPassword} style={{
                                padding: '10px 18px', background: copied ? '#0f172a' : '#16a34a',
                                color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                            }}>
                                {copied ? '✅ Copied!' : '📋 Copy'}
                            </button>
                        </div>
                        <button onClick={() => setShowNewPassword(null)} style={{
                            padding: '10px 20px', background: '#166534', color: 'white',
                            border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                        }}>
                            ✓ Done — Hide Password
                        </button>
                    </div>
                )}

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
                                        marginLeft: 10, fontSize: 10, background: 'rgba(255,255,255,0.15)',
                                        padding: '3px 10px', borderRadius: 6, fontWeight: 800
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
                                <button className="adm-ud-hero-btn activate" disabled={actionLoading} onClick={() => changeStatus('Active')}>
                                    ✅ Activate
                                </button>
                            )}
                            {user.status === 'Active' && (
                                <button className="adm-ud-hero-btn freeze" disabled={actionLoading} onClick={() => changeStatus('Frozen')}>
                                    ❄️ Freeze
                                </button>
                            )}
                            {user.status !== 'Deactivated' && (
                                <button className="adm-ud-hero-btn deactivate" disabled={actionLoading} onClick={() => changeStatus('Deactivated')}>
                                    🚫 Deactivate
                                </button>
                            )}
                            <button className="adm-ud-hero-btn admin" disabled={actionLoading} onClick={toggleAdmin}>
                                {user.role === 'Admin' ? '👤 Remove Admin' : '👑 Make Admin'}
                            </button>
                            <button className="adm-ud-hero-btn" style={{ background: '#7c3aed', color: 'white' }} disabled={actionLoading} onClick={resetPassword}>
                                🔑 Reset Password
                            </button>
                            
                            {/* ⚠️ NAYA: Add Balance Button */}
                            <button
                                className="adm-ud-hero-btn"
                                style={{ background: '#16a34a', color: 'white' }}
                                disabled={actionLoading}
                                onClick={() => setShowAddBalance(true)}
                            >
                                💰 Add Balance
                            </button>
                        </div>
                    )}
                </div>

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

                <div className="adm-ud-grid">
                    <div className="adm-ud-card">
                        <div className="adm-ud-card-title">👤 Personal Information</div>
                        <div className="adm-ud-info-list">
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Full Name</span><span className="adm-ud-info-value">{user.name}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Email / Mobile</span><span className="adm-ud-info-value mono">{user.email}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Mobile</span><span className="adm-ud-info-value mono">{user.mobile}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Country</span><span className="adm-ud-info-value">{user.country || 'Brazil'}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Currency</span><span className="adm-ud-info-value">{user.currency || 'BRL'}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">User ID</span><span className="adm-ud-info-value mono">{user._id}</span></div>
                        </div>
                    </div>

                    <div className="adm-ud-card">
                        <div className="adm-ud-card-title">🛡️ Security & Tracking</div>
                        <div className="adm-ud-info-list">
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">IP Address</span><span className="adm-ud-info-value ip">{user.ipAddress || 'N/A'}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Status</span><span className={`adm-ud-status ${user.status.toLowerCase()}`}>{user.status}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Role</span><span className={`adm-ud-status ${user.role === 'Admin' ? 'active' : 'pending'}`}>{user.role}</span></div>
                            <div className="adm-ud-info-item"><span className="adm-ud-info-label">Account Created</span><span className="adm-ud-info-value">{formatDate(user.createdAt)}</span></div>
                        </div>
                    </div>
                </div>

                <div className="adm-ud-card" style={{ marginTop: '20px' }}>
                    <div className="adm-ud-card-title">🏦 User Bank Accounts ({user.bankAccounts?.length || 0})</div>
                    {(!user.bankAccounts || user.bankAccounts.length === 0) ? (
                        <div className="adm-ud-empty" style={{ padding: '20px' }}>No bank accounts added by this user yet.</div>
                    ) : (
                        user.bankAccounts.map(acc => (
                            <div key={acc._id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{acc.bankName} ({acc.bankCode})</strong>
                                    {acc.isDefault && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>DEFAULT</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                                    <div>👤 Holder: <strong>{acc.accountHolderName}</strong></div>
                                    <div>🔢 Account: <strong>{acc.accountNumber}</strong> | Agency: <strong>{acc.agency}</strong></div>
                                    <div>🆔 CPF/CNPJ: <strong>{acc.cpfCnpj}</strong></div>
                                    <div>📋 Type: <strong>{acc.accountType || 'N/A'}</strong></div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="adm-ud-tabs">
                    {tabs.map(tab => (
                        <button key={tab.key} className={`adm-ud-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                            <span>{tab.icon}</span>{tab.label}<span className="adm-ud-tab-count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {currentList.length === 0 ? (
                    <div className="adm-ud-empty">No {activeTab === 'all' || activeTab === 'transactions' ? 'activity' : activeTab} records found</div>
                ) : (
                    <div className="adm-ud-list">
                        {currentList.map(tx => {
                            const info = getTxInfo(tx);
                            return (
                                <div key={tx._id} className="adm-ud-list-item">
                                    <div className={`adm-ud-list-icon ${info.cls}`}>{info.icon}</div>
                                    <div className="adm-ud-list-content">
                                        <div className="adm-ud-list-title">{info.label}{tx.planName && ` • Plan ${tx.planName}`}</div>
                                        <div className="adm-ud-list-sub">
                                            <span>{formatDate(tx.createdAt)}</span>
                                            {tx.cryptoType && <span>• {tx.cryptoType}</span>}
                                            <span className={`adm-ud-status ${tx.status.toLowerCase()}`}>{tx.status}</span>
                                        </div>
                                        {tx.type === 'Withdraw' && tx.bankDetails?.bankCode && (
                                            <div className="adm-ud-bank-card">
                                                <div className="adm-ud-bank-title">🏦 Bank Details</div>
                                                <div className="adm-ud-bank-grid">
                                                    <div className="adm-ud-bank-item"><span className="adm-ud-bank-label">Bank</span><span className="adm-ud-bank-value">{tx.bankDetails.bankName}</span></div>
                                                    <div className="adm-ud-bank-item"><span className="adm-ud-bank-label">Holder</span><span className="adm-ud-bank-value">{tx.bankDetails.accountHolderName}</span></div>
                                                    <div className="adm-ud-bank-item"><span className="adm-ud-bank-label">Account No.</span><span className="adm-ud-bank-value">{tx.bankDetails.accountNumber}</span></div>
                                                    <div className="adm-ud-bank-item"><span className="adm-ud-bank-label">CPF</span><span className="adm-ud-bank-value">{tx.bankDetails.cpfCnpj}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`adm-ud-list-amount ${info.sign === '+' ? 'positive' : 'negative'}`}>{info.sign} R$ {tx.amount.toLocaleString()}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ⚠️ ADD BALANCE MODAL */}
            {showAddBalance && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', zIndex: 9999, padding: '20px'
                }} onClick={() => setShowAddBalance(false)}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '24px',
                        width: '100%', maxWidth: '400px'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>💰 Add Balance</h3>
                            <button onClick={() => setShowAddBalance(false)} style={{ background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>
                        <form onSubmit={handleAddBalance}>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>Balance Type</label>
                                <select 
                                    value={balanceForm.balanceType} 
                                    onChange={(e) => setBalanceForm({ ...balanceForm, balanceType: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                >
                                    <option value="balance">Top-Up Balance</option>
                                    <option value="miningCapital">Mining Capital</option>
                                    <option value="rpBalance">RP Balance</option>
                                    <option value="withdrawableBalance">Withdrawable Balance</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount (R$)</label>
                                <input 
                                    type="number" 
                                    value={balanceForm.amount} 
                                    onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })} 
                                    placeholder="e.g. 500" 
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' }} 
                                    required 
                                />
                            </div>
                            <button type="submit" disabled={balanceLoading} style={{ width: '100%', padding: '14px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>
                                {balanceLoading ? '⏳ Adding...' : '✓ Add Balance'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserDetailPage;