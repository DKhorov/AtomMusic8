/*
 * AtomGlide Labs - API Client Module
 * File: axios.js
 */

import axios from 'axios';

function resolveBaseURL() {
    const fromEnv = process.env.NEXT_PUBLIC_API_URL;
    if (fromEnv) return `${fromEnv}/api`;
    return '/api';
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

// Предотвращаем одновременные параллельные запросы на refresh
let refreshPromise = null;

export async function refreshAccessToken() {
    if (typeof window === 'undefined') return null;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const base = resolveBaseURL();
            const res = await axios.post(`${base}/auth/refresh`, { refreshToken });
            if (res.status === 200) {
                const { accessToken, refreshToken: newRefreshToken } = res.data;
                localStorage.setItem('accessToken', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }
                return accessToken;
            }
        } catch (err) {
            // Очищаем невалидные токены
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            // ВАЖНО: Редиректим на /login ТОЛЬКО если мы сейчас НЕ на странице логина или регистрации
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/register') {
                    window.location.href = '/login';
                }
            }
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

let refreshInterval = null;

export function startTokenAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    const FOUR_AND_A_HALF_MINUTES = 4.5 * 60 * 1000;
    refreshInterval = setInterval(() => {
        refreshAccessToken();
    }, FOUR_AND_A_HALF_MINUTES);
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
        if (!originalRequest) return Promise.reject(error);

        const requestUrl = String(originalRequest.url || '');
        const isAuthRequest = requestUrl.includes('/auth/login') ||
            requestUrl.includes('/auth/refresh') ||
            requestUrl.includes('/auth/register');

        // Не пытаемся обновлять токен, если 401 вернул сам запрос логина или рефреша
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;
            const newToken = await refreshAccessToken();
            if (newToken) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);