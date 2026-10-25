import React, { useState, useEffect } from 'react';
import AdminHeader from '../components/AdminHeader';
import api from '../utils/api';

const AdminPaymentSettingsPage = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Form states
    const [btc, setBtc] = useState('');
    const [btcr, setBtcr] = useState('');
    const [usdt, setUsdt] = useState('');
    const [eth, setEth] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [bankName, setBankName] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [evpKey, setEvpKey] = useState('');
    const [randomKey, setRandomKey] = useState('');
    
    // 👈 NAYA: Telegram Support State
    const [telegramSupport, setTelegramSupport] = useState('vickypp');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/payment');
                const s = res.data;
                setSettings(s);
                setBtc(s.wallets?.BTC || '');
                setBtcr(s.wallets?.['BTC(r)'] || '');
                setUsdt(s.wallets?.USDT || '');
                setEth(s.wallets?.ETH || '');
                setCompanyName(s.bank?.companyName || '');
                setBankName(s.bank?.bankName || '');
                setCnpj(s.bank?.cnpj || '');
                setEvpKey(s.bank?.evpKey || '');
                setRandomKey(s.bank?.randomKey || '');
                
                // 👈 NAYA: Load Telegram Support
                setTelegramSupport(s.telegramSupport || 'vickypp');
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to load settings' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.put('/payment', {
                wallets: {
                    BTC: btc,
                    'BTC(r)': btcr,
                    USDT: usdt,
                    ETH: eth
                },
                bank: {
                    companyName,
                    bankName,
                    cnpj,
                    evpKey,
                    randomKey
                },
                // 👈 NAYA: Send Telegram Support
                telegramSupport
            });
            setSettings(res.data.settings);
            setMessage({ type: 'success', text: '✅ Settings updated! Users will see new details immediately.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage({ type: '', text: '' }), 5000);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 14px',
        background: '#f8fafc',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#0f172a',
        outline: 'none',
        fontFamily: 'monospace'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 800,
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: '6px',
        letterSpacing: '0.3px'
    };

    const cardStyle = {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
                <AdminHeader />
                <div style={{ padding: 60, textAlign: 'center' }}>⏳ Loading settings...</div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
            <AdminHeader />

            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '30px 24px' }}>

                <div style={{ marginBottom: 25 }}>
                    <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                        💰 Payment & Support Settings
                    </h1>
                    <p style={{ fontSize: 13, color: '#64748b' }}>
                        Update crypto wallets, bank details, and Telegram support username here
                    </p>
                </div>

                {message.text && (
                    <div style={{
                        padding: '14px 18px',
                        background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        borderRadius: 12,
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 20
                    }}>
                        {message.text}
                    </div>
                )}

                {/* 👈 NAYA: Telegram Support Settings */}
                <div style={cardStyle}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                        💬 Telegram Support
                    </div>
                    <div>
                        <label style={labelStyle}>Telegram Username (without @)</label>
                        <input 
                            style={{...inputStyle, fontFamily: 'inherit'}} 
                            value={telegramSupport} 
                            onChange={(e) => setTelegramSupport(e.target.value)} 
                            placeholder="e.g. vickypp" 
                        />
                        <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                            Users will see "Contact us on Telegram" button with this username on every page.
                        </p>
                    </div>
                </div>

                {/* Crypto Wallets */}
                <div style={cardStyle}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                        🪙 Crypto Wallet Addresses
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={labelStyle}>Bitcoin (BTC)</label>
                            <input style={inputStyle} value={btc} onChange={(e) => setBtc(e.target.value)} placeholder="abc123..." />
                        </div>
                        <div>
                            <label style={labelStyle}>Bitcoin Brazil (BTC(r))</label>
                            <input style={inputStyle} value={btcr} onChange={(e) => setBtcr(e.target.value)} placeholder="abc123..." />
                        </div>
                        <div>
                            <label style={labelStyle}>USDT (TRC20/BEP20)</label>
                            <input style={inputStyle} value={usdt} onChange={(e) => setUsdt(e.target.value)} placeholder="abc123..." />
                        </div>
                        <div>
                            <label style={labelStyle}>Ethereum (ETH)</label>
                            <input style={inputStyle} value={eth} onChange={(e) => setEth(e.target.value)} placeholder="abc123..." />
                        </div>
                    </div>
                </div>

                {/* Bank Details */}
                <div style={cardStyle}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                        🏦 Bank Account Details (NEXIUM)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <div>
                            <label style={labelStyle}>Company Name</label>
                            <input style={{...inputStyle, fontFamily: 'inherit'}} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Bank Name</label>
                            <input style={{...inputStyle, fontFamily: 'inherit'}} value={bankName} onChange={(e) => setBankName(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>CNPJ</label>
                            <input style={inputStyle} value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>EVP / PIX Key (CNPJ)</label>
                            <input style={inputStyle} value={evpKey} onChange={(e) => setEvpKey(e.target.value)} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={labelStyle}>Random Key</label>
                            <input style={inputStyle} value={randomKey} onChange={(e) => setRandomKey(e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: saving ? '#94a3b8' : '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    {saving ? '⏳ Saving...' : '💾 Save All Settings'}
                </button>

                {settings?.lastUpdated && (
                    <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                        Last updated: {new Date(settings.lastUpdated).toLocaleString('pt-BR')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPaymentSettingsPage;