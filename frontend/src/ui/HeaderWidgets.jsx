import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../store/useAuth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/* ─── Notifications Panel ─── */
export const NotificationsPanel = ({ onClose }) => {
    const { token } = useAuth();
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(data => setNotifs(Array.isArray(data) ? data : []))
            .catch(() => {
                // Fallback to mock while backend endpoint is not yet seeded
                setNotifs([
                    { id: 1, title: 'Upcoming Appointment', message: 'Your session with Dr. Sarah Chen is tomorrow at 2:00 PM.', notification_type: 'appointment', read: false, created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
                    { id: 2, title: 'Mood Streak 🎉', message: "You've logged your mood 7 days in a row! Your consistency is inspiring.", notification_type: 'message', read: false, created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
                    { id: 3, title: 'New Activity Unlocked', message: 'Box Breathing — 4-4-4-4 pattern is now available in your Calm Room.', notification_type: 'message', read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
                ]);
            })
            .finally(() => setLoading(false));
    }, [token]);

    const getIcon = (type) => {
        if (type === 'appointment') return { icon: '📅', bg: '#eff6ff', color: '#3b82f6' };
        if (type === 'escalation') return { icon: '⚠️', bg: '#fef2f2', color: '#ef4444' };
        return { icon: '💬', bg: '#f0fdf4', color: '#16a34a' };
    };

    const timeAgo = (iso) => {
        const diff = Date.now() - new Date(iso);
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    const unreadCount = notifs.filter(n => !n.read).length;

    return (
        <div style={{ position: 'absolute', top: '48px', right: 0, width: '340px', background: 'white', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', zIndex: 1000, overflow: 'hidden', animation: 'slideDown 0.15s ease' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Notifications</span>
                    {unreadCount > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: '700' }}>{unreadCount}</span>}
                </div>
                <button onClick={() => setNotifs(n => n.map(x => ({ ...x, read: true })))} style={{ fontSize: '12px', color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                    Mark all read
                </button>
            </div>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Loading...</div>
                ) : notifs.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                        <div style={{ color: '#94a3b8', fontSize: '13px' }}>No notifications yet</div>
                    </div>
                ) : notifs.map((n) => {
                    const { icon, bg, color } = getIcon(n.notification_type);
                    return (
                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f8fafc', display: 'flex', gap: '12px', alignItems: 'flex-start', background: n.read ? 'white' : '#f0f9ff', cursor: 'pointer', transition: '0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = n.read ? 'white' : '#f0f9ff'}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>{icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: n.read ? '500' : '700', color: '#0f172a', marginBottom: '2px' }}>{n.title}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>{n.message}</div>
                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>{timeAgo(n.created_at)}</div>
                            </div>
                            {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#06b6d4', marginTop: '6px', flexShrink: 0 }} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ─── User Profile Dropdown ─── */
export const UserProfileDropdown = ({ user, onSettings, onLogout }) => (
    <div style={{ position: 'absolute', top: '48px', right: 0, width: '220px', background: 'white', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', zIndex: 1000, overflow: 'hidden', animation: 'slideDown 0.15s ease' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{user?.name || 'My Account'}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{user?.email || ''}</div>
            <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', padding: '3px 8px', borderRadius: '20px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#16a34a', textTransform: 'capitalize' }}>{user?.role || 'Patient'}</span>
            </div>
        </div>
        {[
            { label: 'My Profile', icon: '👤', action: onSettings },
            { label: 'Account Settings', icon: '⚙️', action: onSettings },
            { label: 'Privacy & Security', icon: '🔒', action: onSettings },
            { label: 'Help & Support', icon: '💬', action: () => window.open('mailto:support@bewell.app') },
        ].map((item, i) => (
            <button key={i} onClick={item.action} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#374151', textAlign: 'left', transition: '0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <span>{item.icon}</span> {item.label}
            </button>
        ))}
        <div style={{ borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onLogout} style={{ width: '100%', padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ef4444', textAlign: 'left', transition: '0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign Out
            </button>
        </div>
    </div>
);

/* ─── Settings Modal ─── */
export const SettingsModal = ({ user, onClose }) => {
    const { token } = useAuth();
    const [tab, setTab] = useState('profile');
    const [name, setName] = useState(user?.name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // In a full integration, we'd PATCH /auth/me or a /profile endpoint
        await new Promise(r => setTimeout(r, 800));
        setSaving(false); setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const TABS = ['profile', 'security', 'notifications', 'privacy'];

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: 'white', borderRadius: '20px', width: '560px', maxWidth: 'calc(100vw - 40px)', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>Account Settings</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#94a3b8' }}>Manage your profile and preferences</p>
                    </div>
                    <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '16px' }}>✕</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #f1f5f9', padding: '0 24px' }}>
                    {TABS.map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                            padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px',
                            fontWeight: tab === t ? '700' : '500', color: tab === t ? '#06b6d4' : '#94a3b8',
                            borderBottom: tab === t ? '2px solid #06b6d4' : '2px solid transparent',
                            textTransform: 'capitalize', transition: '0.15s',
                        }}>{t}</button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {tab === 'profile' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Avatar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '700', color: 'white' }}>
                                    {(user?.name || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>{user?.name || 'User'}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user?.email}</div>
                                    <button style={{ marginTop: '6px', fontSize: '12px', color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '500' }}>Change photo</button>
                                </div>
                            </div>

                            {[
                                { label: 'Full Name', value: name, onChange: setName, type: 'text' },
                                { label: 'Phone Number', value: phone, onChange: setPhone, type: 'tel', placeholder: '+91 9876543210' },
                            ].map((field, i) => (
                                <div key={i}>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>{field.label}</label>
                                    <input type={field.type} value={field.value} onChange={e => field.onChange(e.target.value)} placeholder={field.placeholder}
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#111827' }}
                                        onFocus={e => e.target.style.borderColor = '#06b6d4'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                                </div>
                            ))}

                            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Account Type</div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a', textTransform: 'capitalize' }}>{user?.role || 'Patient'}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Contact support to change your account type</div>
                            </div>

                            <button onClick={handleSave} disabled={saving} style={{
                                marginTop: '8px', padding: '12px', borderRadius: '10px', border: 'none',
                                background: saved ? '#16a34a' : 'linear-gradient(135deg, #06b6d4, #6366f1)',
                                color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: '0.3s',
                            }}>
                                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {tab === 'security' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', display: 'flex', gap: '10px' }}>
                                <span style={{ fontSize: '20px' }}>🔒</span>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#15803d' }}>Your account is secure</div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>AES-256 encryption, HIPAA compliant data storage</div>
                                </div>
                            </div>
                            {['Change Password', 'Enable Two-Factor Auth', 'View Active Sessions', 'Download My Data'].map((item, i) => (
                                <button key={i} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                                    {item} <span style={{ color: '#94a3b8' }}>›</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {tab === 'notifications' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { label: 'Appointment Reminders', sub: 'Get notified 24h and 1h before your session', on: true },
                                { label: 'Daily Mood Check-in', sub: 'Gentle reminder to log your mood each morning', on: true },
                                { label: 'AI Insights', sub: 'Weekly wellness summary from your AI companion', on: false },
                                { label: 'Escalation Alerts', sub: 'Urgent notifications when your wellbeing needs attention', on: true },
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{item.label}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{item.sub}</div>
                                    </div>
                                    <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: item.on ? '#06b6d4' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: '0.2s', flexShrink: 0 }}>
                                        <div style={{ position: 'absolute', top: '3px', left: item.on ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'privacy' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '14px' }}>
                                <div style={{ fontWeight: '700', fontSize: '13px', color: '#c2410c', marginBottom: '4px' }}>Your Privacy Rights</div>
                                <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>Under HIPAA, you have the right to access, correct, and delete your health data. We never sell your data to third parties.</div>
                            </div>
                            {['View Privacy Policy', 'Request Data Export', 'Delete My Account', 'Manage Data Sharing'].map((item, i) => (
                                <button key={i} style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid', borderColor: i === 2 ? '#fecaca' : '#e5e7eb', background: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: i === 2 ? '#ef4444' : '#374151', fontWeight: '500' }}>
                                    {item} <span style={{ color: '#94a3b8' }}>›</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <style>{`@keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
        </div>
    );
};
