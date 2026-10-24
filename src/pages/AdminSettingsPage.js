import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminSettingsPage = () => {
    const [telegramUsername, setTelegramUsername] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSetting = async () => {
            try {
                const res = await api.get('/settings/telegram_username');
                setTelegramUsername(res.data.value);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSetting();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            // Ensure no @ symbol is saved
            const cleanUsername = telegramUsername.replace('@', '');
            await api.put('/settings/telegram_username', { value: cleanUsername });
            setMessage('✅ Settings saved successfully!');
            setTelegramUsername(cleanUsername);
        } catch (err) {
            setMessage('❌ Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '20px', color: '#1e293b' }}>⚙️ System Settings</h2>
            
            {message && (
                <div style={{ padding: '10px', marginBottom: '15px', background: message.includes('✅') ? '#dcfce7' : '#fee2e2', color: message.includes('✅') ? '#166534' : '#991b1b', borderRadius: '5px' }}>
                    {message}
                </div>
            )}

            <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#475569' }}>
                    Telegram Support Username
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ padding: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRight: 'none', borderRadius: '5px 0 0 5px', color: '#64748b' }}>@</span>
                    <input
                        type="text"
                        value={telegramUsername}
                        onChange={(e) => setTelegramUsername(e.target.value)}
                        placeholder="vickypp"
                        style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '0 5px 5px 0', outline: 'none' }}
                    />
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                    Yeh username user panel ke har page par "Contact us on Telegram" button mein show hoga.
                </p>
            </div>

            <button 
                onClick={handleSave} 
                disabled={saving}
                style={{ background: '#2563eb', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
};

export default AdminSettingsPage;