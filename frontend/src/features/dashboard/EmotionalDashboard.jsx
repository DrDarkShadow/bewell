import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { activitiesApi, chatApi } from '../../services/api';

const MOODS = [
    { emoji: '😔', label: 'Struggling' },
    { emoji: '😐', label: 'Okay' },
    { emoji: '🙂', label: 'Content' },
    { emoji: '😌', label: 'Calm' },
    { emoji: '🤩', label: 'Inspired' },
];

const getDayGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
};

const getFormattedDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

const MINI_CHART = [40, 55, 45, 70, 60, 80, 65]; // Simulated weekly calm %
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const EmotionalDashboard = ({ onNavigate }) => {
    const { user } = useAuth();
    const firstName = user?.name?.split(' ')[0] || 'Friend';
    const [selectedMood, setSelectedMood] = useState(2);
    const [intensity, setIntensity] = useState(50);
    const [moodLogged, setMoodLogged] = useState(false);
    const [activities, setActivities] = useState([]);
    const [convCount, setConvCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            activitiesApi.getAll().catch(() => []),
            chatApi.listConversations().catch(() => []),
        ]).then(([acts, convs]) => {
            setActivities(acts);
            setConvCount(convs.length);
        }).finally(() => setStatsLoading(false));
    }, []);

    const breathingCount = activities.filter(a => a.activity_type === 'breathing').length;
    const journalCount = activities.filter(a => a.activity_type === 'journal').length;

    const handleLogMood = () => {
        const moodLabel = MOODS[selectedMood].label.toLowerCase();
        activitiesApi.log('mood', selectedMood * 25, null, { mood: moodLabel, intensity }).catch(() => { });
        setMoodLogged(true);
    };

    const chartMax = Math.max(...MINI_CHART);
    const chartMin = Math.min(...MINI_CHART);
    const normalize = v => 100 - ((v - chartMin) / (chartMax - chartMin)) * 80;

    const svgPoints = MINI_CHART.map((v, i) => `${(i / 6) * 340},${normalize(v)}`).join(' ');

    return (
        <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#1e293b', fontFamily: "'Lora', serif" }}>
                        {getDayGreeting()}, {firstName}
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' }}>
                        {getFormattedDate()} &bull; Take a moment for yourself today.
                    </p>
                </div>
            </div>

            {/* Activity Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {[
                    { label: 'AI Sessions', value: statsLoading ? '—' : convCount, icon: '💬', color: '#06b6d4' },
                    { label: 'Breathing Sessions', value: statsLoading ? '—' : breathingCount, icon: '🫁', color: '#6366f1' },
                    { label: 'Journal Entries', value: statsLoading ? '—' : journalCount, icon: '✍️', color: '#10b981' },
                ].map((stat, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ fontSize: '26px' }}>{stat.icon}</div>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginTop: '2px' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Mood Check-in */}
                    <div style={{ background: 'linear-gradient(135deg, #f0f0ff 0%, #faf5ff 100%)', borderRadius: '16px', padding: '28px', border: '1px solid #e8e4ff' }}>
                        <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                            How are you feeling right now?
                        </h2>
                        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px' }}>
                            Select the emoji that best reflects your current mood.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '24px' }}>
                            {MOODS.map((m, i) => (
                                <button key={i} onClick={() => setSelectedMood(i)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                                        padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                                        background: selectedMood === i ? 'white' : 'transparent',
                                        boxShadow: selectedMood === i ? '0 2px 12px rgba(99,102,241,0.15)' : 'none',
                                        transform: selectedMood === i ? 'scale(1.08)' : 'scale(1)',
                                        transition: 'all 0.2s ease', outline: selectedMood === i ? '2px solid #06b6d4' : 'none',
                                    }}>
                                    <span style={{ fontSize: '28px' }}>{m.emoji}</span>
                                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>{m.label}</span>
                                </button>
                            ))}
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
                                <span>Subtle</span>
                                <span style={{ color: '#06b6d4', fontWeight: '600' }}>Moderate intensity</span>
                                <span>Very intense</span>
                            </div>
                            <input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(+e.target.value)}
                                style={{ width: '100%', accentColor: '#06b6d4', cursor: 'pointer', height: '6px' }} />
                        </div>

                        {moodLogged ? (
                            <div style={{ textAlign: 'center', color: '#06b6d4', fontWeight: '600', fontSize: '14px' }}>
                                ✓ Mood logged. Thank you for checking in!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={handleLogMood} style={{
                                    background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', border: 'none',
                                    padding: '12px 28px', borderRadius: '25px', fontWeight: '600', fontSize: '14px',
                                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(6,182,212,0.4)',
                                }}>Log Mood</button>
                            </div>
                        )}
                    </div>

                    {/* Weekly Reflection Chart */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Weekly Reflection</h3>
                            <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '600', background: '#ecfeff', padding: '4px 10px', borderRadius: '20px' }}>
                                ↗ +12% Calm
                            </span>
                        </div>

                        <svg viewBox="0 0 340 100" width="100%" style={{ overflow: 'visible' }}>
                            <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <polyline fill="url(#chartGrad)" stroke="none"
                                points={`0,100 ${svgPoints} 340,100`} />
                            <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                points={svgPoints} />
                            {MINI_CHART.map((v, i) => (
                                <circle key={i} cx={(i / 6) * 340} cy={normalize(v)} r="3" fill="#06b6d4" />
                            ))}
                        </svg>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                            {DAYS.map(d => <span key={d} style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: '600' }}>{d}</span>)}
                        </div>

                        <p style={{ margin: '16px 0 0', fontSize: '13px', color: '#64748b', fontStyle: 'italic', textAlign: 'center' }}>
                            "You've been feeling calmer this week compared to last. Keep up the breathing exercises!"
                        </p>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Continue journey */}
                    <div style={{ background: '#1e293b', borderRadius: '16px', padding: '24px', color: 'white' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '700' }}>Continue your journey</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#94a3b8', lineHeight: '1.5' }}>
                            Your last session focused on 'Managing Anxiety'. Continue your conversation with the AI Companion.
                        </p>
                        <button onClick={() => onNavigate('chat')} style={{
                            width: '100%', background: '#06b6d4', color: 'white', border: 'none',
                            padding: '12px', borderRadius: '10px', fontWeight: '600', fontSize: '13px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                            Resume Chat
                        </button>
                    </div>

                    {/* Mindfulness */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            Mindfulness for Today
                        </h3>
                        {[
                            { title: '5-Minute Breathing', sub: 'Release tension and find focus', nav: 'calm' },
                            { title: 'Evening Reflection', sub: 'Guided journaling for better sleep', nav: 'journal' },
                        ].map((item, i) => (
                            <button key={i} onClick={() => onNavigate(item.nav)} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '10px 0', border: 'none', background: 'none', cursor: 'pointer',
                                borderBottom: i === 0 ? '1px solid #f1f5f9' : 'none', marginBottom: i === 0 ? '4px' : 0,
                            }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: i === 0 ? 'linear-gradient(135deg, #0f4c5c, #06b6d4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', flexShrink: 0 }} />
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{item.title}</div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.sub}</div>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                            </button>
                        ))}
                    </div>

                    {/* Next Session */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Next Session</div>
                                <div style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '500' }}>with Dr. Sarah Chen</div>
                            </div>
                            <div style={{ background: '#06b6d4', color: 'white', borderRadius: '8px', padding: '4px 10px', textAlign: 'center' }}>
                                <div style={{ fontSize: '9px', fontWeight: '600' }}>OCT</div>
                                <div style={{ fontSize: '18px', fontWeight: '700', lineHeight: '1' }}>25</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', marginBottom: '14px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            Wednesday at 2:00 PM
                        </div>
                        <button onClick={() => onNavigate('appointments')} style={{
                            width: '100%', border: '1px solid #e2e8f0', background: 'white',
                            padding: '10px', borderRadius: '8px', fontSize: '13px', fontWeight: '500',
                            color: '#6366f1', cursor: 'pointer',
                        }}>Reschedule</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmotionalDashboard;
