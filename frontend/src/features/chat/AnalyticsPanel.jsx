import React, { useEffect, useRef } from 'react';

// Mini inline SVG sparkline
const Sparkline = ({ data, color = '#06b6d4', height = 48 }) => {
    if (!data || data.length < 2) return (
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '12px' }}>
            Waiting for data...
        </div>
    );
    const max = Math.max(...data, 0.01);
    const normalize = v => height - (v / max) * (height - 4);
    const w = 260;
    const step = w / (data.length - 1);
    const pts = data.map((v, i) => `${i * step},${normalize(v)}`).join(' ');
    const fill = `0,${height} ${pts} ${(data.length - 1) * step},${height}`;
    return (
        <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon fill="url(#sg)" points={fill} />
            <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={pts} />
            {data.length > 0 && (
                <circle cx={(data.length - 1) * step} cy={normalize(data[data.length - 1])} r="3" fill={color} />
            )}
        </svg>
    );
};

const EmotionBar = ({ label, value, color }) => (
    <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', textTransform: 'capitalize' }}>{label}</span>
            <span style={{ fontSize: '11px', color, fontWeight: '700' }}>{Math.round(value * 100)}%</span>
        </div>
        <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
                height: '100%', background: color, borderRadius: '3px',
                width: `${Math.round(value * 100)}%`,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
        </div>
    </div>
);

const EMOTION_COLORS = {
    joy: '#10b981', neutral: '#94a3b8', sadness: '#3b82f6',
    anger: '#ef4444', fear: '#f59e0b', disgust: '#8b5cf6',
    surprise: '#06b6d4',
};

const STRESS_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#ef4444', severe: '#dc2626' };
const STRESS_LABELS = { low: 'Low', medium: 'Moderate', high: 'High', severe: 'Severe' };

const getStressLevel = (score) => {
    if (score > 0.75) return 'severe';
    if (score > 0.5) return 'high';
    if (score > 0.3) return 'medium';
    return 'low';
};

const AnalyticsPanel = ({ stressHistory, latestEmotion, onNavigate }) => {
    const scrollRef = useRef(null);
    const hasData = stressHistory && stressHistory.length > 0;
    const latest = latestEmotion || {};

    // Current stress
    const currentStress = latest.stress_score ?? (hasData ? stressHistory[stressHistory.length - 1] : 0);
    const stressLevel = getStressLevel(currentStress);
    const stressColor = STRESS_COLORS[stressLevel];
    const stressLabel = STRESS_LABELS[stressLevel];

    // Emotion breakdown
    const emotions = latest.emotions?.scores || {};
    const emotionEntries = Object.entries(emotions)
        .filter(([, v]) => v > 0.01)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    // Keywords / text features
    const keywords = latest.text_features?.keywords || [];
    const sentimentWords = latest.text_features?.negative_words || [];

    // Trend direction
    const trend = stressHistory.length >= 3
        ? stressHistory[stressHistory.length - 1] - stressHistory[stressHistory.length - 3]
        : 0;
    const trendLabel = trend > 0.08 ? '↑ Rising' : trend < -0.08 ? '↓ Easing' : '→ Stable';
    const trendColor = trend > 0.08 ? '#ef4444' : trend < -0.08 ? '#10b981' : '#94a3b8';

    return (
        <div style={{
            width: '300px', minWidth: '300px', background: '#f8fafc',
            borderLeft: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column',
            overflowY: 'auto', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
            {/* Header */}
            <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9', background: 'white' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Live Wellbeing Analysis
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Updates after each message
                </div>
            </div>

            {!hasData ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px', opacity: 0.4 }}>🧠</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
                        Start chatting to see your real-time wellbeing analysis here.
                    </div>
                </div>
            ) : (
                <div style={{ padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }} ref={scrollRef}>

                    {/* Stress Score */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                Stress Level
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: trendColor, background: `${trendColor}18`, padding: '2px 7px', borderRadius: '20px' }}>
                                {trendLabel}
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '30px', fontWeight: '800', color: stressColor, lineHeight: 1 }}>
                                {Math.round(currentStress * 100)}%
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: stressColor }}>{stressLabel}</span>
                        </div>
                        <Sparkline data={stressHistory} color={stressColor} height={44} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '9px', color: '#cbd5e1' }}>Session start</span>
                            <span style={{ fontSize: '9px', color: '#cbd5e1' }}>Now</span>
                        </div>
                    </div>

                    {/* Emotion Breakdown */}
                    {emotionEntries.length > 0 && (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                                Emotion Breakdown
                            </div>
                            {emotionEntries.map(([emotion, value]) => (
                                <EmotionBar key={emotion} label={emotion} value={value} color={EMOTION_COLORS[emotion] || '#6366f1'} />
                            ))}
                        </div>
                    )}

                    {/* Primary Emotion */}
                    {latest.emotions?.primary_emotion && (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>
                                    Primary Emotion
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', textTransform: 'capitalize' }}>
                                    {latest.emotions.primary_emotion}
                                </div>
                            </div>
                            <div style={{ fontSize: '32px' }}>
                                {{ joy: '😊', sadness: '😢', anger: '😤', fear: '😰', neutral: '😐', disgust: '😣', surprise: '😲' }[latest.emotions.primary_emotion] || '🔵'}
                            </div>
                        </div>
                    )}

                    {/* Detected Keywords */}
                    {(keywords.length > 0 || sentimentWords.length > 0) && (
                        <div style={{ background: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                                Detected Keywords
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                {[...keywords, ...sentimentWords].slice(0, 8).map((kw, i) => (
                                    <span key={i} style={{
                                        fontSize: '11px', padding: '3px 8px', borderRadius: '20px', fontWeight: '500',
                                        background: sentimentWords.includes(kw) ? '#fef2f2' : '#f0f9ff',
                                        color: sentimentWords.includes(kw) ? '#dc2626' : '#0284c7',
                                        border: `1px solid ${sentimentWords.includes(kw) ? '#fecaca' : '#bae6fd'}`,
                                    }}>
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Session Stats */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
                            Session Stats
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {[
                                { label: 'Messages', value: stressHistory.length },
                                { label: 'Avg Stress', value: `${Math.round((stressHistory.reduce((a, b) => a + b, 0) / stressHistory.length) * 100)}%` },
                                { label: 'Peak Stress', value: `${Math.round(Math.max(...stressHistory) * 100)}%` },
                                { label: 'Min Stress', value: `${Math.round(Math.min(...stressHistory) * 100)}%` },
                            ].map((s, i) => (
                                <div key={i} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginTop: '2px' }}>{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action suggestion if high stress */}
                    {currentStress > 0.45 && (
                        <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)', borderRadius: '12px', padding: '14px', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#059669', marginBottom: '6px' }}>💆 Suggested Action</div>
                            <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.5, marginBottom: '10px' }}>
                                Your stress is elevated. A quick breathing exercise might help right now.
                            </div>
                            <button onClick={() => onNavigate?.('calm')} style={{
                                width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
                                background: '#059669', color: 'white', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                            }}>
                                Open Calm Room →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyticsPanel;
