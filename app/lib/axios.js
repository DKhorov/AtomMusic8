import axios from 'axios';

const PROD_API_URL = 'https://atomglide.of.by';

function resolveBaseURL() {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL;
    if (fromEnv) return `${fromEnv}/api`;
    return `${PROD_API_URL}/api`;
}

export const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    config.baseURL = resolveBaseURL();

    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

function migrateLegacyTokens() {
    if (typeof window === 'undefined') return;
    const hasNew = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');
    if (hasNew) return;
    try {
        const raw = localStorage.getItem('atmusic:auth');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.accessToken) localStorage.setItem('accessToken', parsed.accessToken);
            if (parsed?.refreshToken) localStorage.setItem('refreshToken', parsed.refreshToken);
        }
    } catch {}
}

migrateLegacyTokens();

export async function refreshAccessToken() {
    if (typeof window === 'undefined') return null;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    try {
        const base = resolveBaseURL();
        const res = await axios.post(`${base}/auth/refresh`, { refreshToken });
        if (res.status === 200) {
            const { accessToken, refreshToken: newRefreshToken } = res.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            return accessToken;
        }
    } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }
    return null;
}

let refreshInterval = null;

export function startTokenAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    const FOUR_AND_A_HALF_MINUTES = 4.5 * 60 * 1000;
    refreshInterval = setInterval(() => { refreshAccessToken(); }, FOUR_AND_A_HALF_MINUTES);
}

export function stopTokenAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const newToken = await refreshAccessToken();
            if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                originalRequest.baseURL = resolveBaseURL();
                return api(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);