import React, { useState } from 'react';
import { useAuth } from '../../store/useAuth';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/* ─── Animated background blobs ─── */
const Blobs = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(6,182,212,0.18)', top: '-100px', left: '-100px', animation: 'blob1 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', bottom: '-80px', right: '-80px', animation: 'blob2 10s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', bottom: '30%', left: '20%', animation: 'blob1 12s ease-in-out infinite reverse' }} />
        <style>{`
      @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-15px,25px) scale(0.96)} }
      @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,20px) scale(1.04)} 66%{transform:translate(20px,-15px) scale(0.97)} }
    `}</style>
    </div>
);

/* ─── Left Hero Panel ─── */
const HeroPanel = ({ isLogin }) => (
    <div style={{
        flex: '0 0 48%', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(145deg, #0c1a2e 0%, #0f3460 40%, #0a5a7c 75%, #06b6d4 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
        padding: '60px 56px', color: 'white',
    }}>
        <Blobs />
        <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </div>
                <span style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>BeWell</span>
            </div>

            {/* Hero Text */}
            <h1 style={{ margin: '0 0 16px', fontSize: '38px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-1px' }}>
                {isLogin ? 'Welcome\nback.' : 'Your\nwellness\njourney\nstarts here.'}
            </h1>
            <p style={{ margin: '0 0 48px', fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.65', maxWidth: '340px' }}>
                {isLogin
                    ? 'Continue your path to better mental health. Your secure space is waiting for you.'
                    : 'A calm, confidential space powered by AI — designed with clinical care in mind.'}
            </p>

            {/* Stats / Trust */}
            <div style={{ display: 'flex', gap: '32px' }}>
                {[
                    { value: '10K+', label: 'Active Users' },
                    { value: '98%', label: 'Privacy Score' },
                    { value: '24/7', label: 'AI Support' },
                ].map((s, i) => (
                    <div key={i}>
                        <div style={{ fontSize: '22px', fontWeight: '800', color: '#67e8f9' }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Floating Card */}
            <div style={{ marginTop: '48px', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '320px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #06b6d4, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>HIPAA Compliant & Encrypted</div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>End-to-end encryption on every session</div>
                </div>
            </div>
        </div>
    </div>
);

/* ─── Input with icon ─── */
const IconInput = ({ label, type, placeholder, value, onChange, children, right }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>{label}</label>
            <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${focused ? '#06b6d4' : '#e5e7eb'}`, borderRadius: '11px', height: '48px', paddingLeft: '12px', paddingRight: '4px', transition: '0.2s', background: 'white', boxShadow: focused ? '0 0 0 3px rgba(6,182,212,0.12)' : 'none' }}>
                <span style={{ color: focused ? '#06b6d4' : '#9ca3af', display: 'flex', flexShrink: 0, transition: '0.2s' }}>{children}</span>
                <input type={type} placeholder={placeholder} value={value} onChange={onChange}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#111827', background: 'transparent', padding: '0 8px', height: '100%' }} />
                {right}
            </div>
        </div>
    );
};

/* ─── Main Auth Page ─── */
const AuthPage = () => {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('patient');
    const [phone, setPhone] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const endpoint = isLogin ? '/auth/local/login' : '/auth/local/signup';
            const body = isLogin ? { email, password } : { email, password, name, role, phone: phone || undefined };
            const res = await fetch(`${API}${endpoint}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Authentication failed');
            login(data.token, data.user);
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const switchMode = () => { setIsLogin(!isLogin); setError(''); };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
            <HeroPanel isLogin={isLogin} />

            {/* Right: Form Panel */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: '40px 24px', overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: '420px' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '28px' }}>
                        <h2 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800', color: '#111827', letterSpacing: '-0.5px' }}>
                            {isLogin ? 'Sign in to your account' : 'Create your account'}
                        </h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                            {isLogin ? 'Welcome back — your mental health space is ready.' : 'Start your free mental wellness journey today.'}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
                            <svg width="16" height="16" style={{ flexShrink: 0, marginTop: '1px' }} viewBox="0 0 24 24" fill="#dc2626"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" /></svg>
                            <span style={{ fontSize: '13px', color: '#dc2626' }}>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Signup-only fields */}
                        {!isLogin && (
                            <>
                                <IconInput label="Full Name" type="text" placeholder="Your preferred name" value={name} onChange={e => setName(e.target.value)}>
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                                </IconInput>
                                <IconInput label="Phone (optional)" type="tel" placeholder="+91 9876543210" value={phone} onChange={e => setPhone(e.target.value)}>
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.58 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.79-.79a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                </IconInput>
                                {/* Role Selector */}
                                <div style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>I am a...</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {[{ v: 'patient', label: '👤 Individual Patient' }, { v: 'professional', label: '🩺 Clinical Provider' }].map(r => (
                                            <button key={r.v} type="button" onClick={() => setRole(r.v)} style={{
                                                padding: '11px', borderRadius: '10px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', transition: '0.15s',
                                                border: role === r.v ? '2px solid #06b6d4' : '1.5px solid #e5e7eb',
                                                background: role === r.v ? '#ecfeff' : 'white',
                                                color: role === r.v ? '#0891b2' : '#4b5563',
                                            }}>{r.label}</button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <IconInput label="Email Address" type="email" placeholder="you@private.com" value={email} onChange={e => setEmail(e.target.value)}>
                            <svg height="17" width="17" viewBox="0 0 32 32" fill="currentColor"><path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" /></svg>
                        </IconInput>

                        {/* Password */}
                        <IconInput label="Password" type={showPass ? 'text' : 'password'} placeholder="At least 8 chars, 1 uppercase, 1 digit" value={password} onChange={e => setPassword(e.target.value)}
                            right={
                                <button type="button" onClick={() => setShowPass(!showPass)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 10px', color: '#9ca3af', display: 'flex' }}>
                                    <svg viewBox="0 0 576 512" height="16" fill="currentColor"><path d={showPass ? "M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1z" : "M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"} /></svg>
                                </button>
                            }>
                            <svg height="17" width="17" viewBox="-64 0 512 512" fill="currentColor"><path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" /><path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" /></svg>
                        </IconInput>

                        {/* Remember / Forgot */}
                        {isLogin && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#374151', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#06b6d4', width: '14px', height: '14px' }} />
                                    Remember me
                                </label>
                                <span style={{ fontSize: '13px', color: '#06b6d4', fontWeight: '500', cursor: 'pointer' }}>Forgot password?</span>
                            </div>
                        )}
                        {!isLogin && <div style={{ height: '6px' }} />}

                        {/* Submit */}
                        <button type="submit" disabled={loading} style={{
                            width: '100%', height: '48px', borderRadius: '11px', border: 'none',
                            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0891b2, #6366f1)',
                            color: 'white', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: loading ? 'none' : '0 4px 18px rgba(6,182,212,0.4)', transition: '0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            {loading
                                ? <span style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                : (isLogin ? 'Sign In →' : 'Create Account →')}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', margin: '20px 0 16px' }}>
                        {isLogin ? "Don't have an account?" : 'Already registered?'}{' '}
                        <span onClick={switchMode} style={{ color: '#0891b2', fontWeight: '700', cursor: 'pointer' }}>
                            {isLogin ? 'Sign up free' : 'Sign in'}
                        </span>
                    </p>

                    {/* Divider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
                        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                        <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>OR CONTINUE WITH</span>
                        <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                    </div>

                    {/* Social Buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[
                            { label: 'Google', icon: <svg width="18" height="18" viewBox="0 0 512 512"><path fill="#FBBB00" d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456C103.821,274.792,107.225,292.797,113.47,309.408z" /><path fill="#518EF8" d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" /><path fill="#28B446" d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" /><path fill="#F14336" d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0C318.115,0,375.068,22.126,419.404,58.936z" /></svg> },
                            { label: 'Apple', icon: <svg width="18" height="18" viewBox="0 0 22.773 22.773"><path d="M15.769,0c0.053,0,0.106,0,0.162,0c0.13,1.606-0.483,2.806-1.228,3.675c-0.731,0.863-1.732,1.7-3.351,1.573c-0.108-1.583,0.506-2.694,1.25-3.561C13.292,0.879,14.557,0.16,15.769,0z" /><path d="M20.67,16.716c0,0.016,0,0.03,0,0.045c-0.455,1.378-1.104,2.559-1.896,3.655c-0.723,0.995-1.609,2.334-3.191,2.334c-1.367,0-2.275-0.879-3.676-0.903c-1.482-0.024-2.297,0.735-3.652,0.926c-0.155,0-0.31,0-0.462,0c-0.995-0.144-1.798-0.932-2.383-1.642c-1.725-2.098-3.058-4.808-3.306-8.276c0-0.34,0-0.679,0-1.019c0.105-2.482,1.311-4.5,2.914-5.478c0.846-0.52,2.009-0.963,3.304-0.765c0.555,0.086,1.122,0.276,1.619,0.464c0.471,0.181,1.06,0.502,1.618,0.485c0.378-0.011,0.754-0.208,1.135-0.347c1.116-0.403,2.21-0.865,3.652-0.648c1.733,0.262,2.963,1.032,3.723,2.22c-1.466,0.933-2.625,2.339-2.427,4.74C17.818,14.688,19.086,15.964,20.67,16.716z" /></svg> },
                        ].map((b) => (
                            <button key={b.label} type="button" style={{
                                flex: 1, height: '44px', border: '1.5px solid #e5e7eb', background: 'white', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                fontSize: '13px', fontWeight: '500', color: '#374151', cursor: 'pointer', transition: '0.15s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#06b6d4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(6,182,212,0.15)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}>
                                {b.icon} {b.label}
                            </button>
                        ))}
                    </div>

                    {/* Footer */}
                    <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '24px', lineHeight: '1.6' }}>
                        🔒 HIPAA Compliant · AES-256 Encrypted · Your data is never sold
                    </p>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AuthPage;
