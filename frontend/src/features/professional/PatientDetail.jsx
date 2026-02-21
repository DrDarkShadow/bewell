import React, { useState } from 'react';

const SESSIONS = [
    { date: 'Feb 21, 2026', time: '10:00 AM', duration: '45 min', topic: 'Workplace Anxiety', risk: 'high', summary: 'Patient reported escalating anxiety around team meetings. Mentions of sleep disruption (3-4 hrs/night). Introduced cognitive restructuring framework.', status: 'pending', sentiment: [40, 35, 55, 30, 60, 45, 50] },
    { date: 'Feb 18, 2026', time: '2:00 PM', duration: '50 min', topic: 'Coping Mechanisms', risk: 'medium', summary: 'Discussed the 5-4-3-2-1 grounding technique. Patient receptive. Breathing exercise logs show 3x daily usage. Social anxiety remains high.', status: 'approved', sentiment: [50, 60, 65, 70, 65, 75, 72] },
    { date: 'Feb 14, 2026', time: '11:00 AM', duration: '40 min', topic: 'Initial Assessment', risk: 'medium', summary: 'First full session. Primary stressors identified: work pressure, family conflict, social isolation. Established baseline wellbeing score: 38/100.', status: 'approved', sentiment: [30, 35, 40, 38, 42, 45, 44] },
];

const RISK_STYLES = {
    high: { bg: '#fee2e2', color: '#dc2626' },
    medium: { bg: '#fef3c7', color: '#d97706' },
    low: { bg: '#dcfce7', color: '#16a34a' },
};

const PatientDetail = ({ patient, onBack }) => {
    const [approving, setApproving] = useState(null);
    const [approved, setApproved] = useState({});

    const handleApprove = (idx) => setApproved(prev => ({ ...prev, [idx]: 'approved' }));
    const handleReject = (idx) => setApproved(prev => ({ ...prev, [idx]: 'rejected' }));

    return (
        <div style={{ padding: '28px 32px', overflowY: 'auto', height: '100%' }}>
            {/* Back + Header */}
            <div style={{ marginBottom: '24px' }}>
                <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                    Back to Patients
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #fee2e2, #fca5a5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: '700', color: '#dc2626' }}>
                            {patient.avatar}
                        </div>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{patient.name}</h1>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Age {patient.age}</span>
                                <span style={{ color: '#e2e8f0' }}>·</span>
                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{patient.sessions} sessions</span>
                                <span style={{ color: '#e2e8f0' }}>·</span>
                                {patient.tags.map((t, i) => (
                                    <span key={i} style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '20px', fontWeight: '500' }}>{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ padding: '6px 14px', borderRadius: '8px', background: RISK_STYLES[patient.risk].bg, color: RISK_STYLES[patient.risk].color, fontSize: '12px', fontWeight: '700' }}>
                            {patient.risk.toUpperCase()} RISK
                        </span>
                        <button style={{ padding: '6px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                            Schedule Session
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                    { label: 'Wellbeing Score', value: '38 / 100', note: '↓ from 42', color: '#ef4444' },
                    { label: 'Current Emotion', value: patient.emotion, note: 'Last session', color: '#f59e0b' },
                    { label: 'Breathing Sessions', value: '14', note: 'This week', color: '#06b6d4' },
                    { label: 'Crisis Flags', value: '2', note: 'Needs attention', color: '#ef4444' },
                ].map((s, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>{s.value}</div>
                        <div style={{ fontSize: '11px', color: s.color, marginTop: '4px', fontWeight: '500' }}>{s.note}</div>
                    </div>
                ))}
            </div>

            {/* Session Timeline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Session History & AI Notes</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    Human-in-the-loop review required
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {SESSIONS.map((s, i) => {
                    const currentStatus = approved[i] || s.status;
                    const risk = RISK_STYLES[s.risk] || RISK_STYLES.medium;
                    const svgMax = Math.max(...s.sentiment), svgMin = Math.min(...s.sentiment);
                    const norm = v => 32 - ((v - svgMin) / (svgMax - svgMin + 1)) * 28;
                    const pts = s.sentiment.map((v, j) => `${(j / 6) * 180},${norm(v)}`).join(' ');

                    return (
                        <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '20px 24px', border: '1px solid', borderColor: currentStatus === 'pending' ? '#fed7aa' : '#f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{s.topic}</span>
                                        {currentStatus === 'pending' && (
                                            <span style={{ fontSize: '11px', fontWeight: '700', background: '#fff7ed', color: '#ea580c', padding: '2px 8px', borderRadius: '20px', border: '1px solid #fed7aa' }}>
                                                AWAITING CLINICAL REVIEW
                                            </span>
                                        )}
                                        {currentStatus === 'approved' && (
                                            <span style={{ fontSize: '11px', fontWeight: '700', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '20px' }}>✓ APPROVED</span>
                                        )}
                                        {currentStatus === 'rejected' && (
                                            <span style={{ fontSize: '11px', fontWeight: '700', background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '20px' }}>✗ REMOVED</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.date} · {s.time} · {s.duration}</div>
                                </div>
                                {/* Mini Sentiment Sparkline */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sentiment Flow</div>
                                    <svg viewBox="0 0 180 36" width="120" height="24">
                                        <polyline fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
                                    </svg>
                                </div>
                            </div>

                            {/* AI Summary */}
                            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '12px 14px', marginBottom: currentStatus === 'pending' ? '14px' : 0 }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                                    AI-Generated Summary
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.55' }}>{s.summary}</p>
                            </div>

                            {/* Approve / Reject */}
                            {currentStatus === 'pending' && (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px' }}>
                                    <button onClick={() => handleReject(i)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #fca5a5', background: 'white', color: '#ef4444', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                        Remove from Record
                                    </button>
                                    <button onClick={() => handleApprove(i)} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                        Approve & Save →
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PatientDetail;
