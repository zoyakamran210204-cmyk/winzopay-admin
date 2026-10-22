import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import api from '../utils/api';
import './AdminTransactionsPage.css';

const AdminTransactionsPage = () => {
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending-deposits');
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    // ================================
    // Load Transactions
    // ================================
    const loadTransactions = async () => {
        try {
            const res = await api.get('/admin/transactions');
            setTransactions(res.data);
        } catch (err) {
            console.error('Load failed:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTransactions();
        const interval = setInterval(loadTransactions, 30000);
        return () => clearInterval(interval);
    }, [navigate]);

    // ================================
    // Approve / Reject
    // ================================
    const handleAction = async (transactionId, action) => {
        const confirmMsg = `Are you sure you want to ${action} this transaction?`;
        if (!window.confirm(confirmMsg)) return;

        setMessage({ type: '', text: '' });
        setActionLoading(transactionId);

        try {
            await api.put('/admin/transaction/action', { transactionId, action });
            setMessage({ type: 'success', text: `✅ Transaction ${action} successfully` });
            loadTransactions();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // ================================
    // Delete
    // ================================
    const handleDelete = async (transactionId) => {
        if (!window.confirm('⚠️ Are you sure? This will PERMANENTLY delete this transaction. This cannot be undone!')) {
            return;
        }

        setMessage({ type: '', text: '' });
        setActionLoading(transactionId);

        try {
            await api.delete(`/admin/transaction/${transactionId}`);
            setMessage({ type: 'success', text: '🗑️ Transaction deleted permanently' });
            loadTransactions();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Delete failed' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // ================================
    // Filters
    // ================================
    const pendingDeposits = transactions.filter(t => t.type === 'Deposit' && t.status === 'Pending');
    const pendingWithdraws = transactions.filter(t => t.type === 'Withdraw' && t.status === 'Pending');
    const allDeposits = transactions.filter(t => t.type === 'Deposit');
    const allWithdraws = transactions.filter(t => t.type === 'Withdraw');
    const allTransactions = transactions;

    const tabs = [
        { key: 'pending-deposits', label: 'Pending Deposits', icon: '⬇️', count: pendingDeposits.length, highlight: true },
        { key: 'pending-withdraws', label: 'Pending Withdrawals', icon: '⬆️', count: pendingWithdraws.length, highlight: true },
        { key: 'all-deposits', label: 'All Deposits', icon: '📥', count: allDeposits.length },
        { key: 'all-withdraws', label: 'All Withdrawals', icon: '📤', count: allWithdraws.length },
        { key: 'all', label: 'All Transactions', icon: '📋', count: allTransactions.length }
    ];

    const getCurrentList = () => {
        if (activeTab === 'pending-deposits') return pendingDeposits;
        if (activeTab === 'pending-withdraws') return pendingWithdraws;
        if (activeTab === 'all-deposits') return allDeposits;
        if (activeTab === 'all-withdraws') return allWithdraws;
        return allTransactions;
    };

    const currentList = getCurrentList();

    // Helpers
    const formatDate = (d) => {
        return new Date(d).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    // ================================
    // Render Transaction Card
    // ================================
    const renderCard = (tx) => {
        const isPending = tx.status === 'Pending';
        const isDeposit = tx.type === 'Deposit';
        const isWithdraw = tx.type === 'Withdraw';
        const isLoading = actionLoading === tx._id;

        return (
            <div key={tx._id} className={`adm-tx-card ${tx.status.toLowerCase()}`}>
                
                {/* Card Header */}
                <div className="adm-tx-card-header">
                    <div className="adm-tx-card-left">
                        <div className={`adm-tx-icon ${isDeposit ? 'deposit' : 'withdraw'}`}>
                            {isDeposit ? '⬇️' : isWithdraw ? '⬆️' : '💱'}
                        </div>
                        <div className="adm-tx-info">
                            <div className="adm-tx-info-title">
                                {tx.type} Request
                                <span className={`adm-status-badge ${tx.status.toLowerCase()}`} style={{
                                    fontSize: '10px',
                                    padding: '3px 10px',
                                    borderRadius: '6px'
                                }}>
                                    {tx.status}
                                </span>
                            </div>
                            <div className="adm-tx-info-sub">
                                User: <strong>{tx.userId?.name || 'Unknown'}</strong>
                                <span>•</span>
                                <span>{tx.userId?.mobile || 'N/A'}</span>
                                <span>•</span>
                                <span>IP: {tx.userId?.ipAddress || tx.ipAddress || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="adm-tx-card-right">
                        <div className="adm-tx-amount">
                            R$ {tx.amount.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                            {formatDate(tx.createdAt)}
                        </div>
                    </div>
                </div>

                {/* Basic Details */}
                <div className="adm-tx-details">
                    <div className="adm-tx-detail">
                        <div className="adm-tx-detail-label">Payment Method</div>
                        <div className="adm-tx-detail-value">{tx.cryptoType}</div>
                    </div>
                    <div className="adm-tx-detail">
    <div className="adm-tx-detail-label">System ID</div>
    <div className="adm-tx-detail-value mono">
        {tx._id.slice(-8).toUpperCase()}
    </div>
</div>
{tx.transactionId && (
    <div className="adm-tx-detail">
        <div className="adm-tx-detail-label">User UTR / Txn ID</div>
        <div className="adm-tx-detail-value mono" style={{ color: '#1e40af', fontWeight: 800 }}>
            {tx.transactionId}
        </div>
    </div>
)}
{tx.paymentProof && (
    <div className="adm-tx-detail" style={{ gridColumn: 'span 2' }}>
        <div className="adm-tx-detail-label">Payment Proof</div>
        <div className="adm-tx-detail-value" style={{ fontSize: 11 }}>
            {tx.paymentProof}
        </div>
    </div>
)}
                    {tx.planName && (
                        <div className="adm-tx-detail">
                            <div className="adm-tx-detail-label">Plan</div>
                            <div className="adm-tx-detail-value">Plan {tx.planName}</div>
                        </div>
                    )}
                </div>

                {/* Bank Details (only for Withdraw) */}
                {isWithdraw && tx.bankDetails && tx.bankDetails.bankCode && (
                    <div className="adm-tx-bank-box">
                        <div className="adm-tx-bank-title">
                            🏦 Bank Transfer Details
                        </div>
                        <div className="adm-tx-bank-grid">
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label">Bank</div>
                                <div className="adm-tx-bank-value">{tx.bankDetails.bankName} ({tx.bankDetails.bankCode})</div>
                            </div>
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label">Holder Name</div>
                                <div className="adm-tx-bank-value">{tx.bankDetails.accountHolderName}</div>
                            </div>
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label">Account Number</div>
                                <div className="adm-tx-bank-value">{tx.bankDetails.accountNumber}</div>
                            </div>
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label">CPF/CNPJ</div>
                                <div className="adm-tx-bank-value">{tx.bankDetails.cpfCnpj}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PIX Details (only for Withdraw via PIX) */}
                {isWithdraw && tx.pixDetails && tx.pixDetails.pixKey && (
                    <div className="adm-tx-bank-box" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
                        <div className="adm-tx-bank-title" style={{ color: '#166534' }}>
                            📱 PIX Transfer Details
                        </div>
                        <div className="adm-tx-bank-grid">
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label" style={{ color: '#166534' }}>PIX Key Type</div>
                                <div className="adm-tx-bank-value">{tx.pixDetails.pixKeyType}</div>
                            </div>
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label" style={{ color: '#166534' }}>PIX Key</div>
                                <div className="adm-tx-bank-value">{tx.pixDetails.pixKey}</div>
                            </div>
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label" style={{ color: '#166534' }}>Holder Name</div>
                                <div className="adm-tx-bank-value">{tx.pixDetails.accountHolderName}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* USDT Details (only for Withdraw via USDT) */}
                {isWithdraw && tx.cryptoDetails && tx.cryptoDetails.walletAddress && (
                    <div className="adm-tx-bank-box" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
                        <div className="adm-tx-bank-title" style={{ color: '#92400e' }}>
                            🪙 USDT Wallet Details
                        </div>
                        <div className="adm-tx-bank-grid">
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label" style={{ color: '#92400e' }}>Network</div>
                                <div className="adm-tx-bank-value">{tx.cryptoDetails.network}</div>
                            </div>
                            <div className="adm-tx-bank-item">
                                <div className="adm-tx-bank-label" style={{ color: '#92400e' }}>Wallet Address</div>
                                <div className="adm-tx-bank-value">{tx.cryptoDetails.walletAddress}</div>
                            </div>
                            {tx.cryptoDetails.label && (
                                <div className="adm-tx-bank-item">
                                    <div className="adm-tx-bank-label" style={{ color: '#92400e' }}>Label</div>
                                    <div className="adm-tx-bank-value">{tx.cryptoDetails.label}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="adm-tx-actions">
                    {isPending && (
                        <>
                            <button
                                className="adm-tx-btn approve"
                                disabled={isLoading}
                                onClick={() => handleAction(tx._id, 'Approved')}
                            >
                                {isLoading ? '⏳' : '✅ Approve'}
                            </button>
                            <button
                                className="adm-tx-btn reject"
                                disabled={isLoading}
                                onClick={() => handleAction(tx._id, 'Rejected')}
                            >
                                {isLoading ? '⏳' : '❌ Reject'}
                            </button>
                        </>
                    )}
                    {tx.status !== 'Approved' && (
                        <button
                            className="adm-tx-btn delete"
                            disabled={isLoading}
                            onClick={() => handleDelete(tx._id)}
                        >
                            {isLoading ? '⏳' : '🗑️ Delete'}
                        </button>
                    )}
                    {tx.status === 'Approved' && (
                        <div style={{
                            flex: 1,
                            padding: '12px',
                            background: '#dcfce7',
                            color: '#166534',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 700,
                            textAlign: 'center'
                        }}>
                            ✅ Approved Transaction (Cannot Delete)
                        </div>
                    )}
                </div>

            </div>
        );
    };

    return (
        <div className="adm-tx-page">
            <AdminHeader />

            <div className="adm-tx-container">

                <div className="adm-tx-header">
                    <div>
                        <div className="adm-tx-title">Transactions Management</div>
                        <div className="adm-tx-subtitle">
                            Approve, reject, or delete user transactions • {allTransactions.length} total records
                        </div>
                    </div>
                </div>

                {/* Message */}
                {message.text && (
                    <div style={{
                        padding: '14px 18px',
                        background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        marginBottom: '16px'
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="adm-tx-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            className={`adm-tx-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                            <span className={`adm-tx-tab-count ${tab.count === 0 ? 'gray' : ''}`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* List */}
                {loading ? (
                    <div className="adm-tx-loading">⏳ Loading transactions...</div>
                ) : currentList.length === 0 ? (
                    <div className="adm-tx-empty">
                        <div className="adm-tx-empty-icon">📋</div>
                        <div className="adm-tx-empty-title">No transactions found</div>
                        <div className="adm-tx-empty-text">
                            {activeTab === 'pending-deposits' && 'No pending deposits to review'}
                            {activeTab === 'pending-withdraws' && 'No pending withdrawals to review'}
                            {activeTab === 'all-deposits' && 'No deposits recorded yet'}
                            {activeTab === 'all-withdraws' && 'No withdrawals recorded yet'}
                            {activeTab === 'all' && 'No transactions recorded yet'}
                        </div>
                    </div>
                ) : (
                    <div className="adm-tx-list">
                        {currentList.map(renderCard)}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminTransactionsPage;