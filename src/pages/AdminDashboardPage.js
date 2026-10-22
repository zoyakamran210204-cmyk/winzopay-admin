import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import api from '../utils/api';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [usersRes, txRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/transactions')
                ]);

                setUsers(usersRes.data);
                setTransactions(txRes.data);
            } catch (err) {
                console.error('Load failed:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };
        loadData();

        // Auto-refresh every 30s
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [navigate]);

    // ================================
    // Compute Stats
    // ================================
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const frozenUsers = users.filter(u => u.status === 'Frozen').length;
    const adminCount = users.filter(u => u.role === 'Admin').length;

    const pendingDeposits = transactions.filter(t => t.type === 'Deposit' && t.status === 'Pending');
    const pendingWithdraws = transactions.filter(t => t.type === 'Withdraw' && t.status === 'Pending');

    const totalDepositAmount = transactions
        .filter(t => t.type === 'Deposit' && t.status === 'Approved')
        .reduce((s, t) => s + t.amount, 0);

    const totalWithdrawAmount = transactions
        .filter(t => t.type === 'Withdraw' && t.status === 'Approved')
        .reduce((s, t) => s + t.amount, 0);

    const totalBalanceSum = users.reduce((s, u) => s + (u.balance || 0), 0);

    // Recent lists (last 5)
    const recentUsers = [...users]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    const recentPending = [...pendingDeposits, ...pendingWithdraws]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    // Helpers
    const formatDate = (d) => {
        return new Date(d).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="adm-dash-page">
                <AdminHeader />
                <div className="adm-loading">⏳ Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="adm-dash-page">
            <AdminHeader />

            <div className="adm-dash-container">

                {/* Page Header */}
                <div className="adm-dash-header">
                    <div>
                        <div className="adm-dash-title">Admin Dashboard</div>
                        <div className="adm-dash-subtitle">
                            Overview of users, transactions, and pending approvals
                        </div>
                    </div>
                    <div className="adm-dash-live">
                        <span className="adm-dash-live-dot"></span>
                        LIVE • Auto-refresh 30s
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="adm-stats-grid">

                    <div className="adm-stat-card blue">
                        <div className="adm-stat-header">
                            <div className="adm-stat-label">Total Users</div>
                            <div className="adm-stat-icon blue">👥</div>
                        </div>
                        <div className="adm-stat-value">{totalUsers}</div>
                        <div className="adm-stat-sub">
                            {activeUsers} Active • {frozenUsers} Frozen • {adminCount} Admins
                        </div>
                    </div>

                    <div className="adm-stat-card green">
                        <div className="adm-stat-header">
                            <div className="adm-stat-label">Total Deposits</div>
                            <div className="adm-stat-icon green">⬇️</div>
                        </div>
                        <div className="adm-stat-value green">
                            R$ {totalDepositAmount.toLocaleString()}
                        </div>
                        <div className="adm-stat-sub">
                            {pendingDeposits.length} Pending approval
                        </div>
                    </div>

                    <div className="adm-stat-card orange">
                        <div className="adm-stat-header">
                            <div className="adm-stat-label">Total Withdrawals</div>
                            <div className="adm-stat-icon orange">⬆️</div>
                        </div>
                        <div className="adm-stat-value orange">
                            R$ {totalWithdrawAmount.toLocaleString()}
                        </div>
                        <div className="adm-stat-sub">
                            {pendingWithdraws.length} Pending approval
                        </div>
                    </div>

                    <div className="adm-stat-card red">
                        <div className="adm-stat-header">
                            <div className="adm-stat-label">Platform Balance</div>
                            <div className="adm-stat-icon red">💰</div>
                        </div>
                        <div className="adm-stat-value">
                            R$ {totalBalanceSum.toLocaleString()}
                        </div>
                        <div className="adm-stat-sub">
                            Sum of all user balances
                        </div>
                    </div>

                </div>

                {/* Two Column: Pending + Recent Users */}
                <div className="adm-dash-grid">

                    {/* Pending Transactions */}
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <div className="adm-card-title">
                                ⚠️ Pending Approvals
                                {recentPending.length > 0 && (
                                    <span style={{
                                        background: '#dc2626',
                                        color: 'white',
                                        fontSize: '10px',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontWeight: 800
                                    }}>
                                        {recentPending.length}
                                    </span>
                                )}
                            </div>
                            <button
                                className="adm-card-action"
                                onClick={() => navigate('/transactions')}
                            >
                                View All →
                            </button>
                        </div>

                        {recentPending.length === 0 ? (
                            <div className="adm-empty-small">
                                ✅ No pending transactions
                            </div>
                        ) : (
                            recentPending.map(tx => (
                                <div key={tx._id} className="adm-list-item">
                                    <div className="adm-list-avatar" style={{
                                        background: tx.type === 'Deposit'
                                            ? 'linear-gradient(135deg, #1e40af 0%, #0f172a 100%)'
                                            : 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)'
                                    }}>
                                        {tx.type === 'Deposit' ? '⬇️' : '⬆️'}
                                    </div>
                                    <div className="adm-list-content">
                                        <div className="adm-list-title">
                                            {tx.type} • {tx.userId?.name || 'User'}
                                        </div>
                                        <div className="adm-list-sub">
                                            {formatDate(tx.createdAt)}
                                            {tx.userId?.ipAddress && ` • IP: ${tx.userId.ipAddress}`}
                                        </div>
                                    </div>
                                    <div className="adm-list-value">
                                        R$ {tx.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Recent Users */}
                    <div className="adm-card">
                        <div className="adm-card-header">
                            <div className="adm-card-title">👥 Recent Users</div>
                            <button
                                className="adm-card-action"
                                onClick={() => navigate('/users')}
                            >
                                View All →
                            </button>
                        </div>

                        {recentUsers.length === 0 ? (
                            <div className="adm-empty-small">
                                No users yet
                            </div>
                        ) : (
                            recentUsers.map(u => (
                                <div key={u._id} className="adm-list-item">
                                    <div className="adm-list-avatar">
                                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </div>
                                    <div className="adm-list-content">
                                        <div className="adm-list-title">{u.name}</div>
                                        <div className="adm-list-sub">
                                            {u.mobile} • IP: {u.ipAddress || 'N/A'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div className="adm-list-value">
                                            R$ {(u.balance || 0).toLocaleString()}
                                        </div>
                                        <span className={`adm-status-badge ${u.status.toLowerCase()}`}>
                                            {u.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default AdminDashboardPage;