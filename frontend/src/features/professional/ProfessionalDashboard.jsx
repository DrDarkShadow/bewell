import React, { useState } from 'react';

const PATIENTS = [
    { id: 1, name: 'Marcus J.', age: 28, risk: 'high', status: 'Active', lastSession: '2h ago', emotion: 'Anxious', sessions: 12, summary: 'Recurring anxiety regarding workplace social interactions. Sleep disturbance patterns over last 48 hrs.', tags: ['Anxiety', 'Sleep'], avatar: 'MJ' },
    { id: 2, name: 'Sophie L.', age: 34, risk: 'medium', status: 'Active', lastSession: '1d ago', emotion: 'Neutral', sessions: 8, summary: 'Making steady progress with CBT techniques. Reported fewer panic episodes this week.', tags: ['Depression', 'CBT'], avatar: 'SL' },
    { id: 3, name: 'Raj P.', age: 41, risk: 'low', status: 'Stable', lastSession: '3d ago', emotion: 'Calm', sessions: 24, summary: 'Significant improvement in mood regulation. Sleeping 7+ hours consistently.', tags: ['Mood', 'Mindfulness'], avatar: 'RP' },
    { id: 4, name: 'Emma K.', age: 22, risk: 'high', status: 'Urgent', lastSession: '4h ago', emotion: 'Distressed', sessions: 3, summary: 'First-time patient. Escalated crisis flags in last 2 sessions. Requires immediate follow-up.', tags: ['Crisis', 'Trauma'], avatar: 'EK' },
    { id: 5, name: 'James T.', age: 55, risk: 'medium', status: 'Monitoring', lastSession: '2d ago', emotion: 'Fatigued', sessions: 17, summary: 'Grief processing related to recent bereavement. Occasional isolation behavior reported.', tags: ['Grief', 'Isolation'], avatar: 'JT' },
];

const RISK_STYLES = {
    high: { bg: '#fee2e2', color: '#dc2626', label: 'High Risk', dot: '#dc2626' },
    medium: { bg: '#fef3c7', color: '#d97706', label: 'Medium Risk', dot: '#f59e0b' },
    low: { bg: '#dcfce7', color: '#16a34a', label: 'Low Risk', dot: '#22c55e' },
};

const STATUS_STYLES = {
    Active: { bg: '#eff6ff', color: '#3b82f6' },
    Stable: { bg: '#f0fdf4', color: '#16a34a' },
    Urgent: { bg: '#fef2f2', color: '#ef4444' },
    Monitoring: { bg: '#fffbeb', color: '#d97706' },
};

const STATS = [
    { label: 'Active Patients', value: '18', sub: '+2 this week', icon: '👥', color: '#3b82f6' },
    { label: 'High Risk Alerts', value: '3', sub: 'Requires attention', icon: '⚠️', color: '#ef4444' },
    { label: 'Sessions Today', value: '6', sub: '2 remaining', icon: '📋', color: '#8b5cf6' },
    { label: 'Avg. Wellbeing Score', value: '72%', sub: '+4% vs last week', icon: '📈', color: '#06b6d4' },
];

const ProfessionalDashboard = ({ onViewPatient }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const filtered = PATIENTS.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || p.risk === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>Clinical Dashboard</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>Saturday, February 21 · 5 patients need review</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative', cursor: 'pointer' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                        <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />
                    </div>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>D</div>
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '20px' }}>{s.icon}</span>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{s.label}</div>
                        <div style={{ fontSize: '11px', color: s.color, marginTop: '3px', fontWeight: '500' }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Patient Table Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Patient Overview</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Search */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '7px 12px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..." style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#374151', background: 'transparent', width: '140px' }} />
                    </div>
                    {/* Filter */}
                    {['all', 'high', 'medium', 'low'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: '7px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '500',
                            background: filter === f ? '#0f172a' : 'white', color: filter === f ? 'white' : '#64748b',
                            border: filter === f ? 'none' : '1px solid #e2e8f0', transition: '0.15s',
                        }}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Table Head */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.5fr 2fr 1fr', padding: '11px 20px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    {['Patient', 'Risk Level', 'Status', 'Emotion', 'Last Session', 'AI Summary', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
                    ))}
                </div>

                {filtered.map((p, i) => {
                    const risk = RISK_STYLES[p.risk];
                    const status = STATUS_STYLES[p.status];
                    return (
                        <div key={p.id} style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1.5fr 2fr 1fr',
                            padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f8fafc' : 'none',
                            alignItems: 'center', transition: 'background 0.12s',
                            cursor: 'pointer',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            onClick={() => onViewPatient(p)}>
                            {/* Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, ${p.risk === 'high' ? '#fee2e2, #fca5a5' : p.risk === 'medium' ? '#fef3c7, #fde68a' : '#dcfce7, #86efac'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: risk.color }}>
                                    {p.avatar}
                                </div>
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{p.name}</div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Age {p.age} · {p.sessions} sessions</div>
                                </div>
                            </div>
                            {/* Risk */}
                            <div>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: risk.bg, color: risk.color, fontSize: '11px', fontWeight: '600' }}>
                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: risk.dot }} />
                                    {risk.label}
                                </span>
                            </div>
                            {/* Status */}
                            <div>
                                <span style={{ padding: '4px 10px', borderRadius: '20px', background: status.bg, color: status.color, fontSize: '11px', fontWeight: '600' }}>
                                    {p.status}
                                </span>
                            </div>
                            {/* Emotion */}
                            <div style={{ fontSize: '13px', color: '#475569' }}>{p.emotion}</div>
                            {/* Last Session */}
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.lastSession}</div>
                            {/* Summary */}
                            <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {p.summary}
                            </div>
                            {/* Action */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={(e) => { e.stopPropagation(); onViewPatient(p); }} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', fontWeight: '500', color: '#3b82f6', cursor: 'pointer' }}>
                                    Review →
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>All AI-generated summaries are marked <b>"Awaiting Clinical Review"</b> and require your approval before influencing care decisions.</span>
            </div>
        </div>
    );
};

export default ProfessionalDashboard;
