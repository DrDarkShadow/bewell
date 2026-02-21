import React, { useState, useEffect, useRef } from 'react';
import { listeningApi, activitiesApi } from '../../services/api';

const WaveBar = ({ index, isRecording }) => (
    <div style={{
        width: '4px', background: 'white', borderRadius: '2px', opacity: isRecording ? 0.9 : 0.4,
        height: isRecording ? `${20 + Math.random() * 24}px` : '8px',
        animation: isRecording ? `wave ${0.6 + index * 0.1}s ease-in-out infinite alternate` : 'none',
        animationDelay: `${index * 0.08}s`,
        transition: 'height 0.3s ease',
    }} />
);

const ListeningView = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [summary, setSummary] = useState(null);
    const [summarizing, setSummarizing] = useState(false);
    const [summaryError, setSummaryError] = useState('');
    const [transcript, setTranscript] = useState('');
    const [showTranscriptInput, setShowTranscriptInput] = useState(false);
    const [bars] = useState(Array.from({ length: 12 }));
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    useEffect(() => {
        if (isRecording) { timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000); }
        else clearInterval(timerRef.current);
        return () => clearInterval(timerRef.current);
    }, [isRecording]);

    const formatTimer = s => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const handleComplete = () => {
        setIsRecording(false);
        setShowTranscriptInput(true);
    };

    const handleSummarize = async () => {
        if (!transcript.trim()) return;
        setSummarizing(true); setSummaryError('');
        try {
            const result = await listeningApi.summarize(transcript, true);
            const raw = result.summary || '';
            // Log the session duration as a wellness activity
            activitiesApi.log('session', null, elapsed).catch(() => { });
            setSummary({ raw, concerns: [], emotionalState: '"Analyzed"', emotionalNote: 'AI-generated clinical summary below.' });
            setShowTranscriptInput(false);
        } catch (e) {
            setSummaryError(e.message || 'Failed to generate summary');
        } finally {
            setSummarizing(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f6f8fa', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}>
            {/* Session Tag */}
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.12em', marginBottom: '16px', textTransform: 'uppercase' }}>
                {isRecording ? '● ACTIVE SESSION · ID #88421' : 'READY TO RECORD'}
            </div>

            <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: '700', color: '#1e293b', fontFamily: "'Lora', serif" }}>
                {isRecording ? 'Listening to Session' : 'Start a New Session'}
            </h1>
            <p style={{ margin: '0 0 40px', color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '360px', lineHeight: 1.6 }}>
                {isRecording ? "Focus on the conversation. I'm capturing key clinical indicators in real-time." : 'Press the button below to begin recording the session.'}
            </p>

            {/* Recording Circle */}
            <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                {isRecording && (
                    <div style={{ position: 'absolute', width: '220px', height: '220px', borderRadius: '50%', border: '2px solid rgba(6,182,212,0.25)', animation: 'ping 2s ease-in-out infinite' }} />
                )}
                <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: isRecording ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.06)' }} />
                <div style={{
                    width: '150px', height: '150px', borderRadius: '50%',
                    background: isRecording ? 'linear-gradient(135deg, #06b6d4, #0284c7)' : '#e2e8f0',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: isRecording ? '0 0 40px rgba(6,182,212,0.4)' : 'none', transition: 'all 0.4s ease',
                }}>
                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '28px' }}>
                        {bars.map((_, i) => <WaveBar key={i} index={i} isRecording={isRecording} />)}
                    </div>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={isRecording ? 'white' : '#94a3b8'}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke={isRecording ? 'white' : '#94a3b8'} strokeWidth="2" /></svg>
                    {isRecording && <div style={{ fontSize: '10px', fontWeight: '700', color: 'white', letterSpacing: '0.1em' }}>LISTENING</div>}
                </div>
            </div>

            {/* Timer */}
            <div style={{ fontSize: '36px', fontWeight: '300', color: '#1e293b', letterSpacing: '0.08em', marginBottom: '24px', fontFamily: 'monospace' }}>
                {formatTimer(elapsed)}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {!isRecording && !summary ? (
                    <button onClick={() => { setIsRecording(true); setElapsed(0); }} style={{
                        padding: '12px 32px', borderRadius: '25px', border: 'none',
                        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white',
                        fontWeight: '600', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 14px rgba(6,182,212,0.4)',
                    }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />
                        Start Recording
                    </button>
                ) : isRecording && (
                    <>
                        <button onClick={handleComplete} style={{
                            padding: '12px 28px', borderRadius: '25px', border: 'none',
                            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white',
                            fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'white' }} />
                            Complete Recording
                        </button>
                        <button onClick={() => { setIsRecording(false); setElapsed(0); }} style={{
                            padding: '12px 24px', borderRadius: '25px', border: '1.5px solid #e2e8f0',
                            background: 'white', color: '#64748b', fontWeight: '500', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                        }}>
                            × Cancel
                        </button>
                    </>
                )}
            </div>

            {/* Privacy badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '25px', padding: '8px 16px', fontSize: '12px', color: '#0284c7', marginBottom: '24px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Your audio is encrypted and processed securely. HIPAA Compliant.
            </div>

            {/* Transcript input panel — shown after recording stops */}
            {showTranscriptInput && (
                <div style={{ width: '100%', maxWidth: '560px', background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 8px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '6px' }}>Session Recorded — Add Transcript</div>
                    <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>
                        Paste or type the session transcript below. The AI will analyze it and generate a clinical summary.
                    </p>
                    <textarea value={transcript} onChange={e => setTranscript(e.target.value)}
                        placeholder="e.g. Patient: I've been feeling really anxious about work... Therapist: Can you describe what triggers this?..."
                        style={{ width: '100%', minHeight: '120px', padding: '12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '13px', resize: 'vertical', outline: 'none', boxSizing: 'border-box', color: '#374151', lineHeight: '1.5', fontFamily: 'inherit' }}
                        onFocus={e => e.target.style.borderColor = '#06b6d4'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    {summaryError && <div style={{ marginTop: '8px', fontSize: '12px', color: '#ef4444' }}>{summaryError}</div>}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button onClick={handleSummarize} disabled={!transcript.trim() || summarizing} style={{
                            flex: 1, padding: '11px', borderRadius: '10px', border: 'none',
                            background: transcript.trim() ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : '#e2e8f0',
                            color: 'white', fontWeight: '600', fontSize: '13px', cursor: transcript.trim() ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            {summarizing
                                ? <><div style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Analyzing…</>
                                : '🧠 Analyze with AI →'}
                        </button>
                        <button onClick={() => setShowTranscriptInput(false)} style={{ padding: '11px 18px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                            Skip
                        </button>
                    </div>
                </div>
            )}


            {/* Summary */}
            {summary && (
                <div style={{ width: '100%', maxWidth: '560px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                            Session Insights Summary
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: '700', background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: '20px' }}>
                            ⚠ RISK LEVEL: {summary.riskLevel}
                        </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Key Concerns</div>
                            {summary.concerns.map((c, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '13px', color: '#374151' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', marginTop: '6px', flexShrink: 0 }} />
                                    {c}
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Emotional State</div>
                            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', marginBottom: '12px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', fontStyle: 'italic' }}>{summary.emotionalState}</div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{summary.emotionalNote}</div>
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Sentiment Flow</div>
                            <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '2px' }}>
                                {['#22c55e', '#86efac', '#fbbf24', '#f97316', '#ef4444', '#f97316', '#fbbf24', '#22c55e'].map((c, i) => (
                                    <div key={i} style={{ flex: 1, background: c, borderRadius: '2px' }} />
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                <span>START</span><span>END</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
                        <button style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>Discard Draft</button>
                        <button style={{ border: 'none', background: 'none', color: '#06b6d4', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>View Detailed Report →</button>
                    </div>
                </div>
            )}
            <style>{`
        @keyframes ping { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.5} }
        @keyframes wave { from{height:6px} to{height:32px} }
      `}</style>
        </div>
    );
};

export default ListeningView;
