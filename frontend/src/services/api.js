/**
 * BeWell API Service Layer
 * Centralized fetch helpers for all backend endpoints.
 * Base: http://localhost:8000/api/v1
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const getToken = () => localStorage.getItem('token');

const headers = (extra = {}) => ({
    'Content-Type': 'application/json',
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...extra,
});

const request = async (method, path, body) => {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: headers(),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Request failed: ${res.status}`);
    }
    return res.json();
};

// ── Auth ──────────────────────────────────────────────
export const authApi = {
    login: (email, password) =>
        request('POST', '/auth/local/login', { email, password }),
    signup: (email, password, name, role, phone) =>
        request('POST', '/auth/local/signup', { email, password, name, role, phone }),
    me: () => request('GET', '/auth/me'),
};

// ── Chat ──────────────────────────────────────────────
export const chatApi = {
    /**
     * Start a new conversation. Returns { conversation_id, status }
     */
    startConversation: () => request('POST', '/patient/chat/start'),

    /**
     * Send a message. Returns { conversation_id, user_message, ai_message, emotion, suggestion, metrics }
     */
    sendMessage: (conversationId, content) =>
        request('POST', `/patient/chat/${conversationId}/message`, { content }),

    /**
     * Get full message history for a conversation.
     */
    getHistory: (conversationId) =>
        request('GET', `/patient/chat/${conversationId}/history`),

    /**
     * List all conversations for current user.
     */
    listConversations: () => request('GET', '/patient/chat/conversations'),
};

// ── Appointments ─────────────────────────────────────
export const appointmentsApi = {
    /**
     * Send a natural language message to the appointment scheduler agent.
     * Returns { success, message, appointment: { date, time, type, description } }
     */
    chat: (message, conversationHistory = [], existingAppointment = null) =>
        request('POST', '/patient/appointments/chat', {
            message,
            conversation_history: conversationHistory,
            existing_appointment: existingAppointment,
        }),
};

// ── Wellness Activities ───────────────────────────────
export const activitiesApi = {
    /**
     * Log a wellness activity.
     * activity_type: 'breathing' | 'journal' | 'grounding' | 'game' | 'meditation'
     */
    log: (activityType, score = null, durationSecs = null, metadataJson = null) =>
        request('POST', '/patient/activities', {
            activity_type: activityType,
            score,
            duration_secs: durationSecs,
            metadata_json: metadataJson,
        }),

    /**
     * Get all past wellness activities for current user.
     */
    getAll: () => request('GET', '/patient/activities'),
};

// ── Listening Agent ───────────────────────────────────
export const listeningApi = {
    /**
     * Send transcript text to generate an AI medical summary.
     */
    summarize: (transcript, mentalHealthOnly = true) =>
        request('POST', '/patient/listening/summarize', {
            transcript,
            mental_health_only: mentalHealthOnly,
        }),

    /**
     * Generate a treatment plan from a session transcript.
     */
    generateTreatmentPlan: (transcript, summary = null) =>
        request('POST', '/patient/listening/generate-treatment-plan', {
            transcript,
            summary,
        }),

    /**
     * Upload audio file(s) + speakers to transcribe & summarize.
     * files: Array of File objects, speakers: Array of speaker name strings
     */
    transcribeAndSummarize: async (files, speakers, mentalHealthOnly = true) => {
        const formData = new FormData();
        files.forEach((f) => formData.append('files', f));
        speakers.forEach((s) => formData.append('speakers', s));
        formData.append('mental_health_only', mentalHealthOnly.toString());

        const res = await fetch(`${BASE}/patient/listening/transcribe-summarize`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${getToken()}` }, // NO Content-Type (multipart auto-set)
            body: formData,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(err.detail || `Transcription failed: ${res.status}`);
        }
        return res.json();
    },
};
