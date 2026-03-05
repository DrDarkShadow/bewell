"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, Smile, Lock, LogOut, ShieldOff, AlertTriangle, Trash2 } from "lucide-react";
import axios from "axios";

const API_URL = "http://localhost:8000";
const WS_URL = "ws://localhost:8000/ws";

// ─── Anonymous alias generator ──────────────────────────────────────────────
// Deterministic: same user ID always → same alias
const ADJECTIVES = [
    "Silent", "Shadow", "Hidden", "Masked", "Phantom", "Ghost", "Stealth", "Veiled",
    "Covert", "Secret", "Anonymous", "Unknown", "Mystic", "Cipher", "Cloaked", "Unseen",
    "Blurred", "Faded", "Cryptic", "Muted",
];
const NOUNS = [
    "Fox", "Wolf", "Raven", "Panther", "Lynx", "Hawk", "Viper", "Falcon", "Bear",
    "Tiger", "Cobra", "Eagle", "Panda", "Jaguar", "Osprey", "Shark", "Crow", "Mole",
    "Moth", "Wren",
];

function idToAlias(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    const adj = ADJECTIVES[hash % ADJECTIVES.length];
    const noun = NOUNS[Math.floor(hash / ADJECTIVES.length) % NOUNS.length];
    const num = (hash % 9000) + 1000;
    return `${adj}${noun}${num}`;
}

// ─── Emoji list ──────────────────────────────────────────────────────────────
const EMOJIS = [
    "😀", "😂", "😍", "😎", "🤔", "😭", "🥺", "😅", "🤣", "❤️",
    "🔥", "👍", "🙏", "😊", "🎉", "💯", "✅", "🤝", "😈", "👻",
    "🕵️", "🔒", "💬", "🌑", "⚡", "🎭", "🦝", "🦊", "🐺", "🐦",
];

export default function Home() {
    const [isAuth, setIsAuth] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState("");
    const [myAlias, setMyAlias] = useState("");

    // Auth form
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errMsg, setErrMsg] = useState("");
    const [okMsg, setOkMsg] = useState("");

    // Chat
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showEmoji, setShowEmoji] = useState(false);
    const [warningToast, setWarningToast] = useState<{ message: string; count: number } | null>(null);
    const [blockedChats, setBlockedChats] = useState<Set<string>>(new Set());
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [blockedByMe, setBlockedByMe] = useState<Set<string>>(new Set());

    const socketRef = useRef<WebSocket | null>(null);
    const messagesEnd = useRef<HTMLDivElement | null>(null);
    const selectedRef = useRef<any>(null);

    // keep ref in sync
    useEffect(() => { selectedRef.current = selectedUser; }, [selectedUser]);

    useEffect(() => {
        messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Auth ──────────────────────────────────────────────────────────────
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrMsg(""); setOkMsg("");
        try {
            if (isLogin) {
                const fd = new FormData();
                fd.append("username", email);
                fd.append("password", password);
                const res = await axios.post(`${API_URL}/login`, fd);
                localStorage.setItem("token", res.data.access_token);
                setToken(res.data.access_token);
                await loadMe(res.data.access_token);
            } else {
                await axios.post(`${API_URL}/register`, { name, email, password });
                setOkMsg("Registered! Please login.");
                setIsLogin(true);
                setName(""); setEmail(""); setPassword("");
            }
        } catch (err: any) {
            setErrMsg(err.response?.data?.detail || "Something went wrong");
        }
    };

    const loadMe = async (t: string) => {
        try {
            const res = await axios.get(`${API_URL}/users/me`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            setUser(res.data);
            setMyAlias(idToAlias(res.data.id));
            setToken(t);
            setIsAuth(true);
            await loadUsers(t);
        } catch {
            localStorage.removeItem("token");
        }
    };

    const loadUsers = async (t: string) => {
        try {
            const res = await axios.get(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${t}` },
            });
            // Map every user to their alias (hide real name)
            const mappedUsers = res.data.map((u: any) => ({ ...u, alias: idToAlias(u.id) }));
            setUsers(mappedUsers);

            // Initialize blocked status
            const blockedSet = new Set<string>();
            res.data.forEach((u: any) => {
                if (u.blocked_by_me) blockedSet.add(u.id);
            });
            setBlockedByMe(blockedSet);
        } catch { }
    };

    const loadMessages = async (chatWithId: string) => {
        try {
            const res = await axios.get(`${API_URL}/messages/${chatWithId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages(res.data);
        } catch { }
    };

    // Auto-login on mount
    useEffect(() => {
        const saved = localStorage.getItem("token");
        if (saved) loadMe(saved);
    }, []);

    // ── WebSocket ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAuth || !user) return;
        const ws = new WebSocket(`${WS_URL}/${user.id}`);
        socketRef.current = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === "initial_presence") {
                setOnlineUsers(new Set(msg.online_users));
                return;
            }
            if (msg.type === "presence") {
                setOnlineUsers((prev) => {
                    const next = new Set(prev);
                    if (msg.status === "online") next.add(msg.user_id);
                    else next.delete(msg.user_id);
                    return next;
                });
                return;
            }
            if (msg.type === "warning") {
                setWarningToast({ message: msg.message, count: msg.warning_count });
                setTimeout(() => setWarningToast(null), 5000);
                return;
            }
            if (msg.type === "blocked") {
                setWarningToast(null);
                const sel = selectedRef.current;
                if (sel) setBlockedChats((prev) => new Set(prev).add(sel.id));
                return;
            }
            const sel = selectedRef.current;
            const isRelated = sel && (msg.sender_id === sel.id || msg.receiver_id === sel.id);

            if (isRelated) {
                setMessages((prev) => [...prev, msg]);
            } else if (msg.sender_id !== user.id) {
                // Increment unread count if it's from another user
                setUnreadCounts((prev) => ({
                    ...prev,
                    [msg.sender_id]: (prev[msg.sender_id] || 0) + 1,
                }));
            }
        };

        return () => ws.close();
    }, [isAuth, user]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !socketRef.current) return;
        socketRef.current.send(JSON.stringify({
            receiver_id: selectedUser.id,
            content: newMessage.trim(),
        }));
        setNewMessage("");
        setShowEmoji(false);
    };

    const logout = () => {
        localStorage.removeItem("token");
        socketRef.current?.close();
        setIsAuth(false);
        setUser(null);
        setToken("");
        setMyAlias("");
        setSelectedUser(null);
        setMessages([]);
        setUsers([]);
        setBlockedChats(new Set());
        setOnlineUsers(new Set());
        setWarningToast(null);
    };

    const insertEmoji = (emoji: string) => {
        setNewMessage((prev) => prev + emoji);
    };

    const handleClearChat = async () => {
        if (!selectedUser) return;
        if (!confirm("Are you sure you want to clear all messages in this chat? This cannot be undone.")) return;

        try {
            await axios.delete(`${API_URL}/messages/${selectedUser.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessages([]);
        } catch (err) {
            alert("Failed to clear chat");
        }
    };

    const handleBlockUser = async () => {
        if (!selectedUser) return;
        const action = blockedByMe.has(selectedUser.id) ? "unblock" : "block";
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            const res = await axios.post(`${API_URL}/users/${selectedUser.id}/block`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.data.blocked) {
                setBlockedByMe((prev) => new Set(prev).add(selectedUser.id));
            } else {
                setBlockedByMe((prev) => {
                    const next = new Set(prev);
                    next.delete(selectedUser.id);
                    return next;
                });
            }
        } catch (err) {
            alert("Failed to update block status");
        }
    };

    // ─────────────────────────────────────────────────────────────────────
    if (!isAuth) {
        return (
            <div className="auth-overlay">
                <form className="auth-card" onSubmit={handleAuth}>
                    <div className="auth-logo">
                        <h1>Anonomus</h1>
                        <p>Encrypted. Anonymous. Private.</p>
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <label>Display Name (alias)</label>
                            <input
                                type="text"
                                placeholder="e.g. Alex"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {errMsg && <p className="auth-error">{errMsg}</p>}
                    {okMsg && <p className="auth-success">{okMsg}</p>}

                    <button type="submit" className="auth-btn">
                        {isLogin ? "Login" : "Create Account"}
                    </button>

                    <p className="auth-switch" onClick={() => { setErrMsg(""); setOkMsg(""); setIsLogin(!isLogin); }}>
                        {isLogin ? "No account? Sign up" : "Already registered? Login"}
                    </p>
                </form>
            </div>
        );
    }

    const isCurrentModerationBlocked = selectedUser ? blockedChats.has(selectedUser.id) : false;
    const isManuallyBlocked = selectedUser ? blockedByMe.has(selectedUser.id) : false;
    const isCurrentChatBlocked = isCurrentModerationBlocked || isManuallyBlocked;

    return (
        <div className="app-container">
            {warningToast && (
                <div className="warning-toast">
                    <AlertTriangle size={20} />
                    <div className="warning-toast-body">
                        <div className="warning-toast-title">Warning {warningToast.count}/3</div>
                        <div className="warning-toast-msg">{warningToast.message}</div>
                    </div>
                    <button className="warning-toast-close" onClick={() => setWarningToast(null)}>✕</button>
                </div>
            )}

            {/* ── Sidebar ───────────────────────────────────────── */}
            <div className="sidebar">

                <div className="sidebar-header">
                    <span className="sidebar-title">Anonomus</span>
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>

                {/* My anonymous alias display */}
                <div className="my-alias-bar">
                    <div className="my-alias-label">Your anonymous identity</div>
                    <div className="my-alias-name">{myAlias}</div>
                </div>

                <div className="sidebar-search">
                    <div className="search-container">
                        <Search size={15} color="#666" />
                        <input
                            type="text"
                            placeholder="Search contacts"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="chat-list">
                    {users
                        .filter((u) =>
                            u.alias.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((u) => (
                            <div
                                key={u.id}
                                className={`chat-item ${selectedUser?.id === u.id ? "active" : ""}`}
                                onClick={() => {
                                    setSelectedUser(u);
                                    loadMessages(u.id);
                                    setShowEmoji(false);
                                    // Clear unread count when clicking a chat
                                    setUnreadCounts((prev) => ({ ...prev, [u.id]: 0 }));
                                }}
                            >
                                <div className="chat-item-top">
                                    <div className="chat-item-name-group">
                                        <div className={`status-dot ${onlineUsers.has(u.id) ? "online" : "offline"}`} />
                                        {(blockedByMe.has(u.id) || blockedChats.has(u.id)) && <div className="block-dot" />}
                                        <span className="chat-alias">{u.alias}</span>
                                        {unreadCounts[u.id] > 0 && (
                                            <span className="unread-badge">+{unreadCounts[u.id]}</span>
                                        )}
                                    </div>
                                    <span className="chat-time">🔒</span>
                                </div>
                                <div className="chat-preview">Tap to chat securely</div>
                            </div>
                        ))}
                </div>
            </div>

            {/* ── Main Chat Panel ───────────────────────────────── */}
            <div className="chat-window">
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <div className="chat-header-alias">{selectedUser.alias}</div>
                                <div className="chat-header-sub">
                                    {onlineUsers.has(selectedUser.id) ? (
                                        <span className="status-text online">● Online</span>
                                    ) : (
                                        <span className="status-text offline">Offline</span>
                                    )}
                                    <span className="separator">•</span>
                                    <span>Encrypted Chat</span>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button
                                    className={`header-btn block-btn ${blockedByMe.has(selectedUser.id) ? "blocked" : ""}`}
                                    onClick={handleBlockUser}
                                    title={blockedByMe.has(selectedUser.id) ? "Unblock User" : "Block User"}
                                >
                                    <Lock size={16} />
                                    <span>{blockedByMe.has(selectedUser.id) ? "Unblock" : "Block"}</span>
                                </button>
                                <button className="delete-chat-btn header-btn" onClick={handleClearChat} title="Clear Chat">
                                    <Trash2 size={16} />
                                    <span>Clear Chat</span>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="messages-container">
                            <div className="encryption-notice">
                                <Lock size={11} />
                                Messages are encrypted. Nobody outside this chat can read them.
                            </div>

                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`message ${m.sender_id === user.id ? "sent" : "received"}`}
                                >
                                    <div className="message-content">{m.content}</div>
                                    <div className="message-time">
                                        {new Date(m.timestamp).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEnd} />
                        </div>

                        {/* Emoji picker */}
                        {showEmoji && (
                            <div className="emoji-picker-wrapper">
                                {EMOJIS.map((em) => (
                                    <button
                                        key={em}
                                        className="emoji-btn-item"
                                        onClick={() => insertEmoji(em)}
                                        type="button"
                                    >
                                        {em}
                                    </button>
                                ))}
                            </div>
                        )}

                        {isCurrentModerationBlocked && (
                            <div className="blocked-banner">
                                <ShieldOff size={18} />
                                <span>You have been <strong>blocked</strong> from this chat due to violations.</span>
                            </div>
                        )}

                        {isManuallyBlocked && (
                            <div className="blocked-banner manual">
                                <Lock size={18} />
                                <span>You have blocked this user. <strong>Unblock</strong> to send messages.</span>
                            </div>
                        )}

                        {/* The form is now always visible, letting the user try to send messages even if blocked */}
                        <form className="input-area" onSubmit={sendMessage}>
                            <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setShowEmoji((v) => !v)}
                                title="Emoji"
                            >
                                <Smile size={22} />
                            </button>

                            <div className="input-container">
                                <input
                                    type="text"
                                    placeholder="Type a message…"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="send-btn"
                                title="Send"
                                disabled={!newMessage.trim()}
                            >
                                <Send size={17} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="empty-chat">
                        <div className="empty-chat-icon">🕵️</div>
                        <h2>Select a contact to start chatting</h2>
                        <p>Your identity is hidden. You appear as <strong style={{ color: "#00e5a0" }}>{myAlias}</strong></p>
                    </div>
                )}
            </div>
        </div>
    );
}
