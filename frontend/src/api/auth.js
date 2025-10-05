import { api, setAuth, logoutAuth, getAuth } from './client';

export async function registerAccount({ email, password, display_name, username }) {
    const { data } = await api.post('/auth/register', { email, password, display_name, username });
    setAuth(data); // data: { user, tokens }
    return data;
}

export async function loginAccount({ email, password }) {
    const { data } = await api.post('/auth/login', { email, password });
    // merge with existing user if present (register stores user; login just returns tokens)
    const existing = getAuth();
    const merged = existing?.user ? { user: existing.user, tokens: data.tokens } : data;
    setAuth(merged);
    return merged;
}

export async function refreshTokens() {
    const current = getAuth();
    if (!current?.tokens?.refresh_token) return null;
    const { data } = await api.post('/auth/refresh', { refresh_token: current.tokens.refresh_token });
    const merged = { ...(current || {}), tokens: data.tokens };
    setAuth(merged);
    return merged.tokens;
}

export function logout() { logoutAuth(); }

export async function upsertProfile(partial) {
    const { data } = await api.post('/profiles', partial);
    // Attach profile fields to stored user
    const auth = getAuth();
    if (auth?.user) {
        auth.user.display_name = data.display_name;
        auth.user.username = data.username;
        setAuth(auth);
    }
    return data;
}

export function currentUser() { return getAuth()?.user || null; }
