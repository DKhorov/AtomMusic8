"use client";

import { api, refreshAccessToken, startTokenAutoRefresh, stopTokenAutoRefresh } from './axios';

const KEY = 'atmusic:auth';

let cachedAuth = null;
const listeners = new Set();

function notify() {
    for (const cb of listeners) cb();
}

function readFromStorage() {
    try {
        const raw = window.localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function persist(tokens) {
    cachedAuth = tokens;
    if (tokens) {
        try { window.localStorage.setItem(KEY, JSON.stringify(tokens)); } catch {}
        if (tokens.accessToken) localStorage.setItem('accessToken', tokens.accessToken);
        if (tokens.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken);
        startTokenAutoRefresh();
    } else {
        try { window.localStorage.removeItem(KEY); } catch {}
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        stopTokenAutoRefresh();
    }
    notify();
}

export function subscribeAuth(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

export function getAuthSnapshot() {
    if (typeof window === 'undefined') return null;
    if (cachedAuth === null) cachedAuth = readFromStorage();
    return cachedAuth;
}

export function isAuthed() {
    return Boolean(getAuthSnapshot()?.refreshToken);
}

export async function login(identifier, password) {
    const res = await api.post('/auth/login', { login: identifier, password });
    persist({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user || null,
    });
    return res.data.user;
}

export function logout() {
    persist(null);
}

export async function ensureAvatar() {
    const tokens = getAuthSnapshot();
    const username = tokens?.user?.username;
    if (!username || tokens.user.avatarUrl) return;
    try {
        const res = await api.get(`/users/profile/${encodeURIComponent(username)}`);
        const avatarUrl = res.data?.user?.avatarUrl || null;
        if (avatarUrl) {
            persist({ ...tokens, user: { ...tokens.user, avatarUrl } });
        }
    } catch {}
}

if (typeof window !== 'undefined') {
    const tokens = getAuthSnapshot();
    if (tokens?.refreshToken) {
        startTokenAutoRefresh();
    }
}