import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import EmotionalDashboard from '../features/dashboard/EmotionalDashboard';
import ChatView from '../features/chat/ChatView';
import CalmRoom from '../features/calm-room/CalmRoom';
import ListeningView from '../features/listening/ListeningView';
import { NotificationsPanel, UserProfileDropdown, SettingsModal } from '../ui/HeaderWidgets';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
    { id: 'chat', label: 'AI Companion', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { id: 'calm', label: 'Calm Room', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg> },
    { id: 'listening', label: 'Listening Agent', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg> },
    { id: 'journal', label: 'My Journal', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
];

const PAGE_TITLES = {
    dashboard: 'Dashboard',
    chat: 'AI Companion',
    calm: 'Calm Room',
    listening: 'Listening Agent',
    journal: 'My Journal',
};

const PatientShell = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const notifsRef = useRef(null);
    const profileRef = useRef(null);
    const { logout, user } = useAuth();

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const renderContent = () => {
        switch (activeView) {
            case 'dashboard': return <EmotionalDashboard onNavigate={setActiveView} />;
            case 'chat': return <ChatView />;
            case 'calm': return <CalmRoom />;
            case 'listening': return <ListeningView />;
            case 'journal': return <JournalPlaceholder />;
            default: return <EmotionalDashboard onNavigate={setActiveView} />;
        }
    };

    const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f4f6fb', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
            {/* Left Sidebar */}
            <aside style={{
                width: '210px', minWidth: '210px', background: 'white',
                borderRight: '1px solid #eef2f8', display: 'flex', flexDirection: 'column',
                padding: '22px 14px 18px',
                boxShadow: '1px 0 16px rgba(15,23,42,0.04)',
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '28px', paddingLeft: '6px' }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(6,182,212,0.30)',
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" /></svg>
                    </div>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '14px', color: '#0f172a', letterSpacing: '-0.02em' }}>BeWell</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Patient Portal</div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {NAV_ITEMS.map(item => (
                        <button key={item.id} onClick={() => setActiveView(item.id)} style={{
                            display: 'flex', alignItems: 'center', gap: '11px',
                            padding: '10px 12px', borderRadius: '12px', border: 'none',
                            cursor: 'pointer', textAlign: 'left',
                            fontSize: '13.5px', fontWeight: activeView === item.id ? '700' : '500',
                            fontFamily: 'inherit',
                            transition: 'all 160ms cubic-bezier(0.4,0,0.2,1)',
                            background: activeView === item.id
                                ? 'linear-gradient(135deg, rgba(6,182,212,0.10), rgba(59,130,246,0.07))'
                                : 'transparent',
                            color: activeView === item.id ? '#0891b2' : '#64748b',
                            boxShadow: activeView === item.id ? 'inset 0 0 0 1.5px rgba(6,182,212,0.18)' : 'none',
                        }}
                            onMouseEnter={e => { if (activeView !== item.id) e.currentTarget.style.background = 'rgba(15,23,42,0.035)'; }}
                            onMouseLeave={e => { if (activeView !== item.id) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <span style={{ color: activeView === item.id ? '#06b6d4' : '#94a3b8', display: 'flex', transition: 'color 160ms' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Bottom */}
                <div style={{ borderTop: '1px solid #eef2f8', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button onClick={() => setShowSettings(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b', fontSize: '13px', fontWeight: '500', width: '100%', fontFamily: 'inherit', transition: 'background 160ms' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.035)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                        Settings
                    </button>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#ef4444', fontSize: '13px', fontWeight: '500', width: '100%', fontFamily: 'inherit', transition: 'background 160ms' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top Header Bar */}
                <header style={{ height: '56px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{PAGE_TITLES[activeView]}</h1>
                    </div>

                    {/* Notification Bell */}
                    <div ref={notifsRef} style={{ position: 'relative' }}>
                        <button onClick={() => { setShowNotifs(!showNotifs); setShowProfile(false); }}
                            style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #f1f5f9', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', position: 'relative' }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }} />
                        </button>
                        {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
                    </div>

                    {/* User Avatar */}
                    <div ref={profileRef} style={{ position: 'relative' }}>
                        <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #e2e8f0', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white' }}>
                            {initials}
                        </button>
                        {showProfile && <UserProfileDropdown user={user} onSettings={() => { setShowSettings(true); setShowProfile(false); }} onLogout={logout} />}
                    </div>
                </header>

                {/* Content */}
                <main style={{ flex: 1, overflow: 'auto' }}>
                    {renderContent()}
                </main>
            </div>

            {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} />}
        </div>
    );
};

/* Simple Journal placeholder */
const JournalPlaceholder = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>My Journal</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '300px', lineHeight: 1.6 }}>Your private space to reflect. Journal entries are end-to-end encrypted and only visible to you.</p>
        <button style={{ marginTop: '20px', padding: '12px 24px', borderRadius: '25px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            Write First Entry ✍️
        </button>
    </div>
);

export default PatientShell;
