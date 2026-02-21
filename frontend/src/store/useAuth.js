import { create } from 'zustand';

// Creates a global hook to manage whether the active session is a Patient or a Professional
export const useAuth = create((set) => ({
    token: localStorage.getItem('token') || null,
    role: null, // 'patient' | 'professional'
    user: null,
    isAuthenticated: false,
    isLoading: true, // While verifying token

    login: (token, user) => {
        localStorage.setItem('token', token);
        const userRole = (user?.role || 'patient').toLowerCase();
        localStorage.setItem('role', userRole);
        set({
            token,
            user,
            role: userRole,
            isAuthenticated: true,
            isLoading: false
        });
    },

    logout: () => {
        localStorage.removeItem('token');
        set({
            token: null,
            role: null,
            user: null,
            isAuthenticated: false,
            isLoading: false
        });
    },

    verifyToken: async () => {
        const currentToken = localStorage.getItem('token');
        if (!currentToken) {
            set({ isLoading: false, isAuthenticated: false });
            return;
        }

        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
            // Call /auth/me to restore full user profile
            const res = await fetch(`${apiBase}/auth/me`, {
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });

            if (res.ok) {
                const userData = await res.json();
                const savedRole = (userData?.role || localStorage.getItem('role') || 'patient').toLowerCase();
                localStorage.setItem('role', savedRole);
                set({
                    token: currentToken,
                    isAuthenticated: true,
                    role: savedRole,
                    user: userData,
                    isLoading: false
                });
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                set({ isAuthenticated: false, isLoading: false, token: null, user: null });
            }
        } catch (error) {
            // Network error — fall back to stored role to avoid logging the user out
            const savedRole = localStorage.getItem('role') || 'patient';
            set({ isLoading: false, isAuthenticated: true, role: savedRole });
            console.error("Token verification failed", error);
        }
    }
}));
