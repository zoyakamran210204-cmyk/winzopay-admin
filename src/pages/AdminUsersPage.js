import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../utils/api';
import './AdminUsersPage.css';

const AdminUsersPage = () => {
    const navigate = useNavigate();
    const { admin } = useAdminAuth();

    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    const loadUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
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
        loadUsers();
        const interval = setInterval(loadUsers, 30000);
        return () => clearInterval(interval);
    }, [navigate]);

    useEffect(() => {
        let list = [...users];
        if (statusFilter !== 'all') {
            list = list.filter(u => u.status === statusFilter);
        }
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            list = list.filter(u =>
                u.name?.toLowerCase().includes(s) ||
                u.email?.toLowerCase().includes(s) ||
                u.mobile?.toLowerCase().includes(s) ||
                u.ipAddress?.toLowerCase().includes(s)
            );
        }
        setFiltered(list);
    }, [users, searchTerm, statusFilter]);

    const changeStatus = async (userId, newStatus) => {
        const confirmMsg = `Are you sure you want to set this user to ${newStatus}?`;
        if (!window.confirm(confirmMsg)) return;

        setMessage({ type: '', text: '' });
        setActionLoading(userId);

        try {
            await api.put('/admin/user/status', { userId, status: newStatus });
            setMessage({ type: 'success', text: `✅ User status changed to ${newStatus}` });
            loadUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const toggleAdmin = async (userId, currentRole) => {
        const action = currentRole === 'Admin' ? 'remove-admin' : 'make-admin';
        const confirmMsg = currentRole === 'Admin'
            ? 'Remove admin privileges from this user?'
            : 'Grant admin privileges to this user?';
        
        if (!window.confirm(confirmMsg)) return;

        setMessage({ type: '', text: '' });
        setActionLoading(userId);

        try {
            await api.put(`/admin/user/${action}`, { userId });
            setMessage({ 
                type: 'success', 
                text: currentRole === 'Admin' 
                    ? '✅ Admin privileges removed' 
                    : '✅ User is now an Admin' 
            });
            loadUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Action failed' });
        } finally {
            setActionLoading(null);
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active').length;
    const frozenUsers = users.filter(u => u.status === 'Frozen').length;
    const adminCount = users.filter(u => u.role === 'Admin').length;

    const isSelf = (userId) => admin?._id === userId || admin?.id === userId;

    if (loading) {
        return (
            <div className="adm-users-page">
                <AdminHeader />
                <div className="adm-users-loading">⏳ Loading users...</div>
            </div>
        );
    }

    return (
        <div className="adm-users-page">
            <AdminHeader />
            <div className="adm-users-container">
                <div className="adm-users-header">
                    <div>
                        <div className="adm-users-title">Users Management</div>
                        <div className="adm-users-subtitle">Manage users, freeze accounts, and grant admin privileges</div>
                    </div>
                </div>

                <div className="adm-users-stats">
                    <div className="adm-users-stat"><div className="adm-users-stat-label">Total Users</div><div className="adm-users-stat-value">{totalUsers}</div></div>
                    <div className="adm-users-stat"><div className="adm-users-stat-label">Active</div><div className="adm-users-stat-value green">{activeUsers}</div></div>
                    <div className="adm-users-stat"><div className="adm-users-stat-label">Frozen</div><div className="adm-users-stat-value red">{frozenUsers}</div></div>
                    <div className="adm-users-stat"><div className="adm-users-stat-label">Admins</div><div className="adm-users-stat-value blue">{adminCount}</div></div>
                </div>

                <div className="adm-users-toolbar">
                    <div className="adm-users-search">
                        <span className="adm-users-search-icon">🔍</span>
                        <input type="text" className="adm-users-search-input" placeholder="Search by name, email, mobile, or IP address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="adm-users-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">All Statuses</option>
                        <option value="Active">Active Only</option>
                        <option value="Frozen">Frozen Only</option>
                        <option value="Deactivated">Deactivated Only</option>
                    </select>
                </div>

                {message.text && <div className={`adm-users-message ${message.type}`}>{message.text}</div>}

                {filtered.length === 0 ? (
                    <div className="adm-users-empty">
                        <div className="adm-users-empty-icon">👥</div>
                        <div className="adm-users-empty-title">No users found</div>
                    </div>
                ) : (
                    <div className="adm-users-table">
                        <div className="adm-users-table-header">
                            <div>User</div><div>Contact</div><div>IP Address</div><div>Balance</div><div>Status</div><div>Role</div><div>Actions</div>
                        </div>

                        {filtered.map(user => {
                            const isUserSelf = isSelf(user._id);
                            const isBusy = actionLoading === user._id;

                            return (
                                <div key={user._id} className="adm-user-row">
                                    <div className="adm-user-info" style={{ cursor: 'pointer' }} onClick={() => navigate(`/user/${user._id}`)}>
                                        <div className="adm-user-avatar">{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                                        <div className="adm-user-detail">
                                            <div className="adm-user-name">
                                                {user.name}
                                                {isUserSelf && <span style={{ marginLeft: 6, fontSize: 9, color: '#1e40af', background: '#dbeafe', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>YOU</span>}
                                            </div>
                                            <div className="adm-user-uid">UID: {user._id.slice(-8).toUpperCase()}</div>
                                        </div>
                                    </div>

                                    <div className="adm-cell">{user.mobile}</div>
                                    <div><span className="adm-cell ip">{user.ipAddress || 'N/A'}</span></div>
                                    <div className="adm-cell mono">R$ {(user.balance || 0).toLocaleString()}</div>
                                    <div><span className={`adm-badge ${user.status.toLowerCase()}`}>{user.status}</span></div>
                                    <div><span className={`adm-badge ${user.role.toLowerCase()}`}>{user.role}</span></div>

                                    <div className="adm-user-actions">
                                        <button className="adm-action-btn admin" onClick={() => navigate(`/user/${user._id}`)}>👁️ View</button>
                                        
                                        {user.status !== 'Active' && (
                                            <button className="adm-action-btn activate" disabled={isBusy} onClick={() => changeStatus(user._id, 'Active')}>✅ Activate</button>
                                        )}
                                        {user.status === 'Active' && !isUserSelf && (
                                            <button className="adm-action-btn freeze" disabled={isBusy} onClick={() => changeStatus(user._id, 'Frozen')}>❄️ Freeze</button>
                                        )}
                                        {user.status !== 'Deactivated' && !isUserSelf && (
                                            <button className="adm-action-btn deactivate" disabled={isBusy} onClick={() => changeStatus(user._id, 'Deactivated')}>🚫 Deactivate</button>
                                        )}
                                        {!isUserSelf && (
                                            <button className="adm-action-btn admin" disabled={isBusy} onClick={() => toggleAdmin(user._id, user.role)}>
                                                {user.role === 'Admin' ? '👤 Remove Admin' : '👑 Make Admin'}
                                            </button>
                                        )}
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

export default AdminUsersPage;