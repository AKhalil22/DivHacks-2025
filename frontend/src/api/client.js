import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5173';
const STORAGE_KEY = 'techspace_auth';
let refreshing = null; // Promise while a refresh is in-flight

function loadAuth() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
}
function saveAuth(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function clearAuth() { localStorage.removeItem(STORAGE_KEY); }

export function getAuth() { return loadAuth(); }
export function setAuth(tokens) { saveAuth(tokens); }
export function logoutAuth() { clearAuth(); }

export const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const auth = loadAuth();
    if (auth?.tokens?.id_token) {
        config.headers.Authorization = `Bearer ${auth.tokens.id_token}`;
    }
    return config;
});

async function refreshToken(oldRefresh) {
    const resp = await api.post('/auth/refresh', { refresh_token: oldRefresh });
    const stored = loadAuth() || {}; // preserve user portion if any
    const merged = { ...stored, tokens: resp.data.tokens };
    saveAuth(merged);
    return merged.tokens.id_token;
}

api.interceptors.response.use(
    r => r,
    async (error) => {
        const { config, response } = error || {};
        if (!response) return Promise.reject(error);
        if (response.status === 401 && !config.__retry) {
            const auth = loadAuth();
            if (auth?.tokens?.refresh_token) {
                if (!refreshing) {
                    refreshing = refreshToken(auth.tokens.refresh_token).finally(() => { refreshing = null; });
                }
                try {
                    const newId = await refreshing;
                    config.__retry = true;
                    config.headers.Authorization = `Bearer ${newId}`;
                    return api(config);
                } catch (e) {
                    clearAuth();
                }
            }
        }
        return Promise.reject(error);
    }
);

export function getStoredTokens() { return loadAuth()?.tokens || null; }
