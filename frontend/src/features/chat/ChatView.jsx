import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import { chatApi } from '../../services/api';
import AnalyticsPanel from './AnalyticsPanel';

const COPING_TOOLS = [
    { icon: '🫁', label: 'Guided Breathing', action: 'breathing' },
    { icon: '🧘', label: '3-Min Meditation', action: 'meditation' },
    { icon: '✍️', label: 'Journal Prompt', action: 'journal' },
    { icon: '🌿', label: 'Grounding 5-4-3-2-1', action: 'grounding' },
];

const TypingIndicator = () => (
    <div style={{ display: 'flex', gap: '4px', padding: '12px 14px', background: 'white', borderRadius: '14px', width: '56px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#06b6d4', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
);

/** Strip chain-of-thought <thinking>...</thinking> blocks from AI output */
const stripThinking = (text = '') => text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();

const ChatView = ({ onNavigate }) => {
    const { token } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [lastEmotion, setLastEmotion] = useState(null);
    const [lastSuggestion, setLastSuggestion] = useState(null);
    const [stressHistory, setStressHistory] = useState([]);   // [{score, emotion}]
    const [latestEmotion, setLatestEmotion] = useState(null); // full emotion_data object
    const [error, setError] = useState('');
    const bottomRef = useRef(null);

    const fmt = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fmtDate = (iso) => {
        const d = new Date(iso);
        const today = new Date();
        if (d.toDateString() === today.toDateString()) return 'Today';
        const y = new Date(today); y.setDate(today.getDate() - 1);
        if (d.toDateString() === y.toDateString()) return 'Yesterday';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Load past conversations — only show those with messages
    useEffect(() => {
        chatApi.listConversations()
            .then(convs => setConversations(convs.filter(c => c.message_count > 0)))
            .catch(() => setConversations([]));
    }, [token]);

    // Load history when switching conversation — also rebuild stressHistory from loaded messages
    useEffect(() => {
        if (!activeConvId) return;
        setLoadingHistory(true);
        setStressHistory([]);
        setLatestEmotion(null);
        chatApi.getHistory(activeConvId)
            .then(data => {
                const mapped = data.messages.map(m => ({
                    id: m.id,
                    role: m.sender === 'ai' ? 'assistant' : 'user',
                    content: m.sender === 'ai' ? stripThinking(m.content) : m.content,
                    timestamp: m.timestamp,
                    emotionScore: m.emotion_score,
                }));
                setMessages(mapped);
                // Rebuild stress history from historical user messages
                const stresses = data.messages
                    .filter(m => m.sender === 'patient' && m.emotion_score?.stress_score != null)
                    .map(m => m.emotion_score.stress_score);
                if (stresses.length > 0) {
                    setStressHistory(stresses);
                    const lastUserMsg = data.messages.filter(m => m.sender === 'patient').pop();
                    if (lastUserMsg?.emotion_score) setLatestEmotion(lastUserMsg.emotion_score);
                }
            })
            .catch(() => setMessages([]))
            .finally(() => setLoadingHistory(false));
    }, [activeConvId]);

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const startNewSession = async () => {
        setError('');
        try {
            const { conversation_id } = await chatApi.startConversation();
            setActiveConvId(conversation_id);
            setMessages([{ id: 'init', role: 'assistant', content: "Hey there 😊 I'm your companion here. How are you feeling today? Take your time.", timestamp: new Date().toISOString() }]);
            setLastEmotion(null); setLastSuggestion(null);
            setStressHistory([]); setLatestEmotion(null);
            const convs = await chatApi.listConversations();
            setConversations(convs.filter(c => c.message_count > 0));
        } catch (e) {
            setError('Could not start a session. Check your connection.');
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || sending || !activeConvId) return;
        const userText = input.trim();
        setInput('');
        setSending(true);

        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, { id: tempId, role: 'user', content: userText, timestamp: new Date().toISOString() }]);
        setMessages(prev => [...prev, { id: 'typing', role: 'typing' }]);

        try {
            const res = await chatApi.sendMessage(activeConvId, userText);
            const emotionData = res.emotion || {};

            // Update analytics state
            setLastEmotion(emotionData);
            setLastSuggestion(res.suggestion || null);
            setLatestEmotion(emotionData);
            if (emotionData?.stress_score != null) {
                setStressHistory(prev => [...prev, emotionData.stress_score]);
            }

            const aiContent = stripThinking(res.ai_message.content);
            setMessages(prev => [
                ...prev.filter(m => m.id !== 'typing'),
                { id: res.ai_message.id, role: 'assistant', content: aiContent, timestamp: res.ai_message.timestamp, emotionScore: res.ai_message.emotion_score },
            ]);
            setConversations(prev => prev.map(c => c.id === activeConvId ? { ...c, message_count: c.message_count + 2 } : c));
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== 'typing'));
            setError('Message failed. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

            {/* ── Left Sidebar: Session List ── */}
            <div style={{ width: '220px', minWidth: '220px', borderRight: '1px solid #f1f5f9', background: 'white', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '12px 12px 8px' }}>
                    <button onClick={startNewSession} style={{ width: '100%', padding: '9px 14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        + New Session
                    </button>
                </div>
                <div style={{ padding: '4px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Sessions</div>
                {conversations.length === 0 ? (
                    <div style={{ padding: '16px 12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>No sessions yet</div>
                ) : conversations.map(conv => (
                    <button key={conv.id} onClick={() => setActiveConvId(conv.id)} style={{
                        padding: '9px 12px', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'block', width: '100%',
                        background: activeConvId === conv.id ? '#eff6ff' : 'transparent',
                        borderLeft: activeConvId === conv.id ? '3px solid #06b6d4' : '3px solid transparent',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conv.summary || `Session · ${fmtDate(conv.started_at)}`}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {fmtDate(conv.last_message_at || conv.started_at)} · {conv.message_count} msgs
                        </div>
                    </button>
                ))}
                <div style={{ margin: '10px', marginTop: 'auto', background: '#f0fdf4', borderRadius: '10px', padding: '10px', border: '1px solid #bbf7d0' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#059669', marginBottom: '3px' }}>Clinician Mode</div>
                    <div style={{ fontSize: '11px', color: '#374151', marginBottom: '8px', lineHeight: 1.4 }}>Sync with your primary therapist.</div>
                    <button style={{ width: '100%', padding: '6px', border: '1.5px solid #6ee7b7', borderRadius: '7px', background: 'white', fontSize: '11px', fontWeight: '600', color: '#059669', cursor: 'pointer' }}>Connect Now</button>
                </div>
            </div>

            {/* ── Center: Chat Area ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f6f8fa', minWidth: 0 }}>
                {!activeConvId ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                        <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Start a Session</h2>
                        <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '14px', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>Talk to your AI companion. Everything is confidential and secure.</p>
                        <button onClick={startNewSession} style={{ padding: '12px 28px', borderRadius: '25px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: 'white', fontWeight: '600', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(6,182,212,0.35)' }}>
                            Start New Session →
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Session header */}
                        <div style={{ padding: '10px 16px', background: 'white', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                Session #{activeConvId?.slice(-6)}
                            </div>
                            {stressHistory.length > 0 && (
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: stressHistory[stressHistory.length - 1] > 0.5 ? '#fef2f2' : '#ecfdf5',
                                    color: stressHistory[stressHistory.length - 1] > 0.5 ? '#ef4444' : '#10b981',
                                    borderRadius: '20px', padding: '3px 9px', fontSize: '11px', fontWeight: '700',
                                }}>
                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
                                    {stressHistory[stressHistory.length - 1] > 0.5 ? 'Elevated Stress' : 'Calm'} ({Math.round(stressHistory[stressHistory.length - 1] * 100)}%)
                                </span>
                            )}
                        </div>

                        {/* Error banner */}
                        {error && (
                            <div style={{ margin: '8px 12px 0', padding: '10px 14px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626', display: 'flex', justifyContent: 'space-between' }}>
                                {error}
                                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                            </div>
                        )}

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                            {loadingHistory ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '40px 0' }}>Loading history...</div>
                            ) : (
                                messages.map((msg) => {
                                    if (msg.role === 'typing') return <div key="typing" style={{ display: 'flex', marginBottom: '12px' }}><TypingIndicator /></div>;
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                                            {!isUser && (
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px', flexShrink: 0 }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" /></svg>
                                                </div>
                                            )}
                                            <div style={{ maxWidth: '72%' }}>
                                                <div style={{
                                                    background: isUser ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'white',
                                                    color: isUser ? 'white' : '#1e293b',
                                                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    padding: '10px 14px', fontSize: '14px', lineHeight: '1.55',
                                                    boxShadow: isUser ? 'none' : '0 1px 4px rgba(0,0,0,0.07)',
                                                }}>
                                                    {msg.content}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', textAlign: isUser ? 'right' : 'left' }}>
                                                    {msg.timestamp ? fmt(msg.timestamp) : ''}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Suggestion chips */}
                        {lastSuggestion && (
                            <div style={{ padding: '6px 16px 4px', display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#f6f8fa' }}>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: '28px' }}>Suggested:</span>
                                {COPING_TOOLS.slice(0, 2).map(t => (
                                    <button key={t.action} onClick={() => onNavigate?.('calm')} style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #e2e8f0', background: 'white', fontSize: '12px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        {t.icon} {t.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', padding: '4px', background: '#f6f8fa' }}>
                            AI-POWERED SUPPORT IS NOT A REPLACEMENT FOR MEDICAL DIAGNOSIS OR EMERGENCY CARE
                        </div>

                        {/* Input */}
                        <div style={{ padding: '12px 14px', background: 'white', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '10px', alignItems: 'flex-end', flexShrink: 0 }}>
                            <textarea value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                placeholder="Tell me what's on your mind..."
                                rows={1}
                                style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#1e293b', background: '#f8fafc', lineHeight: '1.5', maxHeight: '100px', overflowY: 'auto' }}
                                onFocus={e => e.target.style.borderColor = '#06b6d4'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                            <button onClick={sendMessage} disabled={!input.trim() || sending || !activeConvId}
                                style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: input.trim() && !sending ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : '#e2e8f0', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: '0.2s' }}>
                                {sending
                                    ? <div style={{ width: '14px', height: '14px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── Right: Analytics Panel ── */}
            <AnalyticsPanel
                stressHistory={stressHistory}
                latestEmotion={latestEmotion}
                onNavigate={onNavigate}
            />

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ChatView;
