import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginAccount, registerAccount, logout, currentUser, refreshTokens } from '../api/auth';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => currentUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const signIn = useCallback(async (email, password) => {
        setLoading(true); setError(null);
        try {
            const data = await loginAccount({ email, password });
            setUser(data.user || null);
            return data;
        } catch (e) {
            setError(e.response?.data?.error?.message || 'Login failed');
            throw e;
        } finally { setLoading(false); }
    }, []);

    const signUp = useCallback(async (email, password, displayName, username) => {
        setLoading(true); setError(null);
        try {
            const data = await registerAccount({ email, password, display_name: displayName, username });
            setUser(data.user || null);
            return data;
        } catch (e) {
            setError(e.response?.data?.error?.message || 'Registration failed');
            throw e;
        } finally { setLoading(false); }
    }, []);

    const signOut = useCallback(() => {
        logout();
        setUser(null);
    }, []);

    // Hydrate user if tokens exist
    useEffect(() => {
        if (!user) {
            api.get('/auth/me').then(r => {
                if (r.data && r.data.uid) {
                    setUser(r.data);
                }
            }).catch(() => { });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Periodic silent refresh
    useEffect(() => {
        const interval = setInterval(() => { refreshTokens().catch(() => { }); }, 1000 * 60 * 15);
        return () => clearInterval(interval);
    }, []);

    const value = { user, loading, error, signIn, signUp, signOut };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}
