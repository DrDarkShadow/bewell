import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../store/useAuth';
import ProfessionalDashboard from '../features/professional/ProfessionalDashboard';
import PatientDetail from '../features/professional/PatientDetail';
import { NotificationsPanel, UserProfileDropdown, SettingsModal } from '../ui/HeaderWidgets';

const PRO_NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
    { id: 'patients', label: 'Patients', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> },
    { id: 'sessions', label: 'Sessions', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { id: 'settings', label: 'Settings', icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg> },
];

const PAGE_TITLES = { dashboard: 'Clinical Dashboard', patients: 'Patient Overview', sessions: 'Session History', settings: 'Settings' };

const ProfessionalShell = () => {
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const notifsRef = useRef(null);
    const profileRef = useRef(null);
    const { logout, user } = useAuth();

    useEffect(() => {
        const handler = (e) => {
            if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const renderContent = () => {
        if (selectedPatient) return <PatientDetail patient={selectedPatient} onBack={() => setSelectedPatient(null)} />;
        return <ProfessionalDashboard onViewPatient={setSelectedPatient} />;
    };

    const initials = (user?.name || 'D').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const title = selectedPatient ? `${selectedPatient.name} — Patient Detail` : PAGE_TITLES[activeView] || 'Clinical Dashboard';

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            {/* Sidebar */}
            <aside style={{ width: '220px', minWidth: '220px', background: 'white', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', padding: '20px 14px', boxShadow: '1px 0 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', paddingLeft: '6px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>BeWell</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>Clinical Portal</div>
                    </div>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {PRO_NAV.map(item => (
                        <button key={item.id} onClick={() => { setActiveView(item.id); setSelectedPatient(null); if (item.id === 'settings') { setShowSettings(true); } }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                textAlign: 'left', fontSize: '13px', fontWeight: '500', transition: 'all 130ms ease',
                                background: activeView === item.id ? '#eff6ff' : 'transparent',
                                color: activeView === item.id ? '#3b82f6' : '#64748b',
                            }}>
                            <span style={{ color: activeView === item.id ? '#3b82f6' : '#94a3b8', display: 'flex' }}>{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Clinician card */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                    <button onClick={() => { setShowSettings(true); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', background: '#f8fafc', marginBottom: '8px', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white', flexShrink: 0 }}>
                            {initials}
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b' }}>{user?.name || 'Dr. Sarah Chen'}</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Clinical Psychologist</div>
                        </div>
                    </button>
                    <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#ef4444', fontSize: '12px', fontWeight: '500', width: '100%' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header Bar */}
                <header style={{ height: '56px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{title}</h1>
                    </div>

                    {/* Alert badge from pending escalations */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '20px', padding: '4px 10px' }}>
                        <div style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%' }} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444' }}>3 High Risk Alerts</span>
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

                    {/* Avatar Dropdown */}
                    <div ref={profileRef} style={{ position: 'relative' }}>
                        <button onClick={() => { setShowProfile(!showProfile); setShowNotifs(false); }}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #e2e8f0', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white' }}>
                            {initials}
                        </button>
                        {showProfile && <UserProfileDropdown user={user} onSettings={() => { setShowSettings(true); setShowProfile(false); }} onLogout={logout} />}
                    </div>
                </header>

                <main style={{ flex: 1, overflow: 'auto' }}>
                    {renderContent()}
                </main>
            </div>

            {showSettings && <SettingsModal user={user} onClose={() => setShowSettings(false)} />}
        </div>
    );
};

export default ProfessionalShell;
