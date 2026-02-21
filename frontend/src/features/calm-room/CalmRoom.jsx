import React, { useState, useEffect, useRef } from 'react';
import { activitiesApi } from '../../services/api';

const PATTERNS = {
    box: { inhale: 4, hold1: 4, exhale: 4, hold2: 4, label: 'Box Breathing', description: 'A simple 4-4-4-4 pattern.' },
    '478': { inhale: 4, hold1: 7, exhale: 8, hold2: 0, label: '4-7-8 Breathing', description: 'Calming 4-7-8 rhythm for sleep.' },
    deep: { inhale: 5, hold1: 2, exhale: 7, hold2: 0, label: 'Deep Calm', description: 'Long exhale for quick relaxation.' },
};

const AMBIENT = ['Rainfall', 'Forest', 'Ocean'];

const CalmRoom = () => {
    const [activePattern, setActivePattern] = useState('box');
    const [running, setRunning] = useState(false);
    const [phase, setPhase] = useState('inhale');
    const [countdown, setCountdown] = useState(4);
    const [scale, setScale] = useState(1);
    const [focusTime, setFocusTime] = useState(25 * 60);
    const [focusRunning, setFocusRunning] = useState(false);
    const [journalText, setJournalText] = useState('');
    const [journalSaved, setJournalSaved] = useState(false);
    const [activeAmbient, setActiveAmbient] = useState('Rainfall');
    const intervalRef = useRef(null);
    const sessionStartRef = useRef(null);
    const pattern = PATTERNS[activePattern];

    useEffect(() => {
        if (!running) { clearInterval(intervalRef.current); setPhase('inhale'); setCountdown(pattern.inhale); setScale(1); return; }
        const phases = [
            { name: 'inhale', dur: pattern.inhale, scaleTarget: 1.6 },
            { name: 'hold', dur: pattern.hold1, scaleTarget: 1.6 },
            { name: 'exhale', dur: pattern.exhale, scaleTarget: 1 },
            ...(pattern.hold2 > 0 ? [{ name: 'rest', dur: pattern.hold2, scaleTarget: 1 }] : []),
        ];
        let phaseIdx = 0; let sec = phases[0].dur;
        setPhase(phases[0].name); setCountdown(sec); setScale(phases[0].scaleTarget);
        intervalRef.current = setInterval(() => {
            sec--;
            if (sec <= 0) { phaseIdx = (phaseIdx + 1) % phases.length; sec = phases[phaseIdx].dur; setPhase(phases[phaseIdx].name); setScale(phases[phaseIdx].scaleTarget); }
            setCountdown(sec);
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [running, activePattern]);

    useEffect(() => {
        if (!focusRunning) return;
        const t = setInterval(() => setFocusTime(s => { if (s <= 1) { clearInterval(t); setFocusRunning(false); return 25 * 60; } return s - 1; }), 1000);
        return () => clearInterval(t);
    }, [focusRunning]);

    const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const phaseLabel = phase === 'inhale' ? 'INHALE' : phase === 'hold' ? 'HOLD' : phase === 'exhale' ? 'EXHALE' : 'REST';

    return (
        <div style={{ minHeight: '100vh', background: '#f6f8fa', overflowY: 'auto' }}>
            {/* Breathing Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 32px' }}>
                {/* Animated Circle */}
                <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px' }}>
                    {[1.0, 0.82, 0.65].map((r, i) => (
                        <div key={i} style={{
                            position: 'absolute', borderRadius: '50%',
                            width: `${220 * r}px`, height: `${220 * r}px`,
                            background: i === 2 ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'rgba(6,182,212,' + (0.1 + i * 0.05) + ')',
                            transform: running && i === 2 ? `scale(${scale})` : 'scale(1)',
                            transition: 'transform ' + (phase === 'inhale' ? pattern.inhale : phase === 'exhale' ? pattern.exhale : 0.3) + 's cubic-bezier(0.4,0,0.2,1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {i === 2 && (
                                <div style={{ textAlign: 'center', color: 'white' }}>
                                    {running ? (
                                        <>
                                            <div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.1em' }}>{phaseLabel}</div>
                                            <div style={{ fontSize: '13px', opacity: 0.85 }}>{countdown} seconds</div>
                                        </>
                                    ) : (
                                        <div style={{ fontSize: '13px', opacity: 0.85 }}>Ready</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '600', color: '#1e293b', fontFamily: "'Lora', serif" }}>{pattern.label}</h2>
                <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '320px', lineHeight: 1.5 }}>
                    Follow the rhythm of the circle to steady your heart rate and clear your mind. {pattern.description}
                </p>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <button onClick={() => {
                        if (!running) { sessionStartRef.current = Date.now(); }
                        else {
                            const dur = Math.round((Date.now() - sessionStartRef.current) / 1000);
                            activitiesApi.log('breathing', null, dur, { pattern: activePattern }).catch(() => { });
                        }
                        setRunning(r => !r);
                    }} style={{
                        padding: '12px 32px', borderRadius: '25px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                        color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(6,182,212,0.4)',
                    }}>
                        {running ? 'Pause Session' : 'Start Session'}
                    </button>
                    <div style={{ position: 'relative' }}>
                        <select value={activePattern} onChange={e => { setActivePattern(e.target.value); setRunning(false); }}
                            style={{ padding: '12px 20px', borderRadius: '25px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '14px', fontWeight: '500', color: '#374151', cursor: 'pointer', appearance: 'none', paddingRight: '36px' }}>
                            {Object.entries(PATTERNS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 3 Tool Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '0 32px 32px', maxWidth: '900px', margin: '0 auto' }}>
                {/* Focus Timer */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>Focus Timer</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>Dedicated quiet time for deep reflection or work.</p>
                    <div style={{ fontSize: '34px', fontWeight: '700', color: '#1e293b', letterSpacing: '0.05em', margin: '8px 0' }}>{formatTime(focusTime)}</div>
                    <button onClick={() => setFocusRunning(r => !r)} style={{
                        width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0',
                        background: '#f8fafc', fontSize: '13px', fontWeight: '500', color: '#374151', cursor: 'pointer',
                    }}>{focusRunning ? 'Pause Timer' : 'Start Timer'}</button>
                </div>

                {/* Quiet Journal */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Quiet Journal</div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#06b6d4', letterSpacing: '0.08em' }}>PROMPT OF THE MOMENT</div>
                        </div>
                    </div>
                    <p style={{ margin: '12px 0', fontSize: '14px', color: '#475569', fontStyle: 'italic', lineHeight: '1.5' }}>
                        "What is one small thing that brought you comfort today?"
                    </p>
                    <textarea value={journalText} onChange={e => setJournalText(e.target.value)} placeholder="Type your thoughts here, no pressure..."
                        style={{ width: '100%', minHeight: '80px', border: 'none', background: '#f8fafc', borderRadius: '8px', padding: '10px', fontSize: '13px', color: '#374151', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                    <button disabled={!journalText.trim()} onClick={() => {
                        activitiesApi.log('journal', null, null, { entry: journalText }).catch(() => { });
                        setJournalText('');
                        setJournalSaved(true);
                        setTimeout(() => setJournalSaved(false), 2000);
                    }} style={{ background: 'none', border: 'none', color: journalText.trim() ? '#06b6d4' : '#cbd5e1', fontSize: '13px', fontWeight: '600', cursor: journalText.trim() ? 'pointer' : 'default', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {journalSaved ? '✓ Saved!' : 'Save Note →'}
                    </button>
                </div>

                {/* 5-4-3-2-1 Grounding */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Grounding 5-4-3-2-1</div>
                    </div>
                    <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#94a3b8' }}>Reconnect with your physical surroundings.</p>
                    {[{ n: 5, label: 'Things you can see' }, { n: 4, label: 'Things you can touch' }, { n: 3, label: 'Things you can hear' }].map(item => (
                        <div key={item.n} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#ecfeff', color: '#06b6d4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>{item.n}</div>
                            <span style={{ fontSize: '13px', color: '#374151' }}>{item.label}</span>
                        </div>
                    ))}
                    <button style={{ width: '100%', marginTop: '14px', border: '1.5px solid #e2e8f0', background: 'white', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>Guide Me</button>
                </div>
            </div>

            {/* Ambient Sound Bar */}
            <div style={{ position: 'sticky', bottom: 0, background: 'white', borderTop: '1px solid #f1f5f9', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Ambient Sound</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {AMBIENT.map(a => (
                        <button key={a} onClick={() => setActiveAmbient(a)} style={{
                            padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '13px', fontWeight: '500',
                            cursor: 'pointer', transition: '0.15s',
                            background: activeAmbient === a ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : '#f1f5f9',
                            color: activeAmbient === a ? 'white' : '#64748b',
                        }}>
                            {a === 'Rainfall' ? '🌧' : a === 'Forest' ? '🌲' : '🌊'} {a}
                        </button>
                    ))}
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
                    <input type="range" min="0" max="100" defaultValue="70" style={{ width: '80px', accentColor: '#06b6d4' }} />
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Mute All</span>
                </div>
            </div>
        </div>
    );
};

export default CalmRoom;
