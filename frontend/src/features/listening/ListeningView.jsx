import React, { useState, useEffect, useRef, useCallback } from 'react';
import { listeningApi, activitiesApi } from '../../services/api';

/* ── Animated mic wave bar ── */
const WaveBar = ({ i, active }) => (
    <div style={{
        width: '3px', borderRadius: '2px',
        background: active ? 'white' : 'rgba(255,255,255,0.35)',
        height: active ? `${10 + Math.sin(Date.now() / 200 + i) * 12 + 12}px` : '4px',
        animation: active ? `wave ${0.5 + i * 0.07}s ease-in-out infinite alternate` : 'none',
        animationDelay: `${i * 0.06}s`,
        transition: 'height 0.25s ease, background 0.3s',
    }} />
);

/* ── Live "pulsing word" component ── */
const LiveWord = ({ text }) => (
    <span style={{
        display: 'inline', padding: '1px 4px', borderRadius: '4px',
        background: 'rgba(6,182,212,0.12)', color: '#0e7490',
        animation: 'fadeIn 0.3s ease',
    }}>{text} </span>
);

const CHUNK_INTERVAL_MS = 5000; // send a transcription chunk every 5s
const BARS = Array.from({ length: 14 });

const ListeningView = () => {
    const [phase, setPhase] = useState('idle'); // idle | recording | summarizing | done
    const [elapsed, setElapsed] = useState(0);
    const [transcript, setTranscript] = useState('');         // accumulated text
    const [liveWords, setLiveWords] = useState('');           // latest chunk words (highlighted)
    const [summary, setSummary] = useState('');
    const [summaryError, setSummaryError] = useState('');
    const [chunkProcessing, setChunkProcessing] = useState(false);

    const timerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const transcriptRef = useRef('');  // ref so chunk callbacks always have latest value
    const transcriptBoxRef = useRef(null);
    const summaryBoxRef = useRef(null);

    // Keep ref in sync
    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    // Timer
    useEffect(() => {
        if (phase === 'recording') {
            timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [phase]);

    // Auto-scroll transcript box to bottom
    useEffect(() => {
        if (transcriptBoxRef.current) {
            transcriptBoxRef.current.scrollTop = transcriptBoxRef.current.scrollHeight;
        }
    }, [transcript, liveWords]);

    const fmt = s => {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const appendTranscript = useCallback((text) => {
        if (!text?.trim()) return;
        const clean = text.trim();
        setLiveWords(clean);
        setTranscript(prev => {
            const sep = prev.length > 0 ? ' ' : '';
            return prev + sep + clean;
        });
        // Clear live highlight after 1.5s
        setTimeout(() => setLiveWords(''), 1500);
    }, []);

    const sendChunk = useCallback(async (blob) => {
        if (!blob || blob.size < 1000) return;
        setChunkProcessing(true);
        try {
            const result = await listeningApi.transcribeChunk(blob);
            if (result?.text) appendTranscript(result.text);
        } catch (e) {
            // silently skip bad chunks
        } finally {
            setChunkProcessing(false);
        }
    }, [appendTranscript]);

    const startRecording = async () => {
        setSummaryError('');
        setTranscript('');
        setLiveWords('');
        setSummary('');
        setElapsed(0);
        transcriptRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/ogg';

            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            // timeslice: fires ondataavailable every CHUNK_INTERVAL_MS
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) sendChunk(e.data);
            };

            recorder.start(CHUNK_INTERVAL_MS);
            setPhase('recording');
        } catch (err) {
            setSummaryError('Microphone access denied. Please allow microphone access and try again.');
        }
    };

    const stopRecording = async () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
            // request the last chunk before stopping
            recorder.requestData();
            recorder.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }

        setPhase('summarizing');
        setSummaryError('');

        // Give the last chunk a moment to process
        await new Promise(r => setTimeout(r, 800));

        const fullTranscript = transcriptRef.current;

        if (!fullTranscript.trim()) {
            setPhase('done');
            setSummaryError('No speech was detected. Please try again and speak clearly.');
            return;
        }

        try {
            const result = await listeningApi.summarize(fullTranscript, true);
            setSummary(result.summary || '');
            // Log session activity
            activitiesApi.log('session', null, elapsed).catch(() => { });
            setPhase('done');
            // Scroll to summary
            setTimeout(() => summaryBoxRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
        } catch (e) {
            setSummaryError('Failed to generate summary. You can try again below.');
            setPhase('done');
        }
    };

    const reset = () => {
        setPhase('idle');
        setTranscript('');
        setLiveWords('');
        setSummary('');
        setSummaryError('');
        setElapsed(0);
        transcriptRef.current = '';
    };

    const retrySummary = async () => {
        if (!transcript.trim()) return;
        setPhase('summarizing');
        setSummaryError('');
        try {
            const result = await listeningApi.summarize(transcript, true);
            setSummary(result.summary || '');
            setPhase('done');
        } catch (e) {
            setSummaryError('Summary failed. Please check your connection.');
            setPhase('done');
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>

            {/* ── Top recording area ── */}
            <div style={{
                background: 'linear-gradient(140deg, #0c1a2e 0%, #0f2540 60%, #0a3a4a 100%)',
                padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                flexShrink: 0,
            }}>
                {/* Status tag */}
                <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: phase === 'recording' ? '#34d399' : '#64748b' }}>
                    {phase === 'recording' && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'blink 1s ease-in-out infinite' }} />}
                    {phase === 'recording' ? 'LIVE SESSION' : phase === 'summarizing' ? '⚙  GENERATING SUMMARY…' : phase === 'done' ? '✓ SESSION COMPLETE' : 'READY TO RECORD'}
                </div>

                {/* Microphone orb */}
                <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    {phase === 'recording' && <>
                        <div style={{ position: 'absolute', width: '190px', height: '190px', borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.20)', animation: 'ping 2.4s ease-in-out infinite' }} />
                        <div style={{ position: 'absolute', width: '170px', height: '170px', borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.13)', animation: 'ping 2.4s ease-in-out infinite 0.6s' }} />
                    </>}
                    <div style={{
                        width: '130px', height: '130px', borderRadius: '50%',
                        background: phase === 'recording'
                            ? 'linear-gradient(135deg, #06b6d4, #0284c7)'
                            : phase === 'summarizing'
                                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                                : '#1e3a5f',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        boxShadow: phase === 'recording' ? '0 0 50px rgba(6,182,212,0.35)' : 'none',
                        transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                    }}>
                        {phase === 'summarizing' ? (
                            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '24px' }}>
                                    {BARS.map((_, i) => <WaveBar key={i} i={i} active={phase === 'recording'} />)}
                                </div>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill={phase === 'recording' ? 'white' : '#475569'}>
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke={phase === 'recording' ? 'white' : '#475569'} strokeWidth="2" />
                                </svg>
                            </>
                        )}
                    </div>
                </div>

                {/* Timer */}
                <div style={{ fontSize: '34px', fontWeight: '200', color: 'white', letterSpacing: '0.10em', fontFamily: 'monospace', marginBottom: '22px', opacity: phase === 'idle' ? 0.3 : 1, transition: 'opacity 0.4s' }}>
                    {fmt(elapsed)}
                </div>

                {/* Live chunk badge */}
                {chunkProcessing && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', color: '#67e8f9', marginBottom: '14px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', animation: 'blink 0.8s ease-in-out infinite' }} />
                        Transcribing chunk…
                    </div>
                )}

                {/* Controls */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    {phase === 'idle' && (
                        <button onClick={startRecording} style={{ padding: '12px 32px', borderRadius: '28px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 18px rgba(6,182,212,0.40)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />
                            Start Recording
                        </button>
                    )}
                    {phase === 'recording' && (
                        <>
                            <button onClick={stopRecording} style={{ padding: '12px 28px', borderRadius: '28px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'white' }} />
                                Stop &amp; Summarize
                            </button>
                            <button onClick={reset} style={{ padding: '12px 20px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontWeight: '500', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancel
                            </button>
                        </>
                    )}
                    {phase === 'done' && (
                        <button onClick={reset} style={{ padding: '12px 28px', borderRadius: '28px', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'inherit' }}>
                            + New Recording
                        </button>
                    )}
                </div>

                {/* Privacy badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '11px', color: '#475569' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    Encrypted · HIPAA Compliant · Audio never stored
                </div>
            </div>

            {/* ── Bottom 2-panel area ── */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 0, background: '#f4f6fb' }}>

                {/* Transcript Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e8edf4' }}>
                    <div style={{ padding: '16px 20px 10px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: phase === 'recording' ? '#22c55e' : '#e2e8f0', transition: '0.3s', boxShadow: phase === 'recording' ? '0 0 6px #22c55e' : 'none' }} />
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Live Transcript</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                            {transcript ? `${transcript.split(' ').length} words` : phase === 'recording' ? 'Listening…' : 'Not started'}
                        </span>
                    </div>

                    <div ref={transcriptBoxRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', fontSize: '14px', lineHeight: '1.8', color: '#334155' }}>
                        {!transcript && phase === 'idle' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.4 }}>🎙</div>
                                <div style={{ fontSize: '13px', lineHeight: 1.6 }}>Press <strong>Start Recording</strong> and speak.<br />Your words will appear here in real time.</div>
                            </div>
                        )}
                        {!transcript && phase === 'recording' && (
                            <div style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', animation: 'fadeIn 0.5s' }}>Waiting for speech…</div>
                        )}
                        {transcript && (
                            <span>
                                {/* Show accumulated text in dark, new chunk highlighted */}
                                {liveWords
                                    ? <>{transcript.slice(0, transcript.length - liveWords.length - 1).trimEnd()}&nbsp;<LiveWord text={liveWords} /></>
                                    : transcript
                                }
                            </span>
                        )}
                    </div>
                </div>

                {/* Summary Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px 10px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>AI Summary</span>
                        </div>
                        {phase === 'summarizing' && (
                            <span style={{ fontSize: '11px', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '10px', height: '10px', border: '1.5px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                Generating…
                            </span>
                        )}
                        {phase === 'done' && summary && (
                            <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#16a34a', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>✓ Complete</span>
                        )}
                    </div>

                    <div ref={summaryBoxRef} style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        {!summary && phase !== 'summarizing' && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#94a3b8' }}>
                                <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.4 }}>🧠</div>
                                <div style={{ fontSize: '13px', lineHeight: 1.6 }}>
                                    {phase === 'done' && !summary
                                        ? 'Summary not generated yet.'
                                        : 'Your AI-generated clinical summary will appear here when you stop recording.'}
                                </div>
                                {phase === 'done' && transcript && !summary && (
                                    <button onClick={retrySummary} style={{ marginTop: '14px', padding: '10px 24px', borderRadius: '20px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        Retry Summary →
                                    </button>
                                )}
                            </div>
                        )}

                        {phase === 'summarizing' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[80, 60, 90, 50, 70].map((w, i) => (
                                    <div key={i} style={{ height: '12px', borderRadius: '6px', background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', width: `${w}%`, animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        )}

                        {summary && (
                            <div style={{ animation: 'fadeIn 0.5s ease' }}>
                                <div style={{ background: 'white', borderRadius: '14px', padding: '18px', boxShadow: '0 1px 6px rgba(15,23,42,0.05)', border: '1px solid #e8edf4' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span style={{ fontSize: '14px' }}>🧠</span>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>Clinical Summary</div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>AI-generated · Requires clinician review</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
                                        {summary}
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                    <button onClick={retrySummary} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        ↺ Regenerate
                                    </button>
                                    <button style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontWeight: '600', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                        Export Report →
                                    </button>
                                </div>
                            </div>
                        )}

                        {summaryError && (
                            <div style={{ marginTop: '12px', padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', fontSize: '13px', color: '#dc2626', lineHeight: 1.5 }}>
                                {summaryError}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes ping { 0%,100%{transform:scale(1);opacity:0.8} 50%{transform:scale(1.18);opacity:0.2} }
                @keyframes wave { from{height:4px} to{height:28px} }
                @keyframes spin { to{transform:rotate(360deg)} }
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
                @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
                @keyframes shimmer {
                    0%{background-position:200% 0}
                    100%{background-position:-200% 0}
                }
            `}</style>
        </div>
    );
};

export default ListeningView;
