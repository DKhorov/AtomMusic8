"use client";
import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import {
    subscribeAuth, getAuthSnapshot, isAuthed,
    login as apiLogin, logout as apiLogout,
    ensureAvatar,
} from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const tokens = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null);
    const router = useRouter();

    useEffect(() => {
        if (!tokens?.user?.username || tokens.user.avatarUrl) return;
        ensureAvatar();
    }, [tokens?.user?.username, tokens?.user?.avatarUrl]);

    const value = {
        isAuthed: Boolean(tokens?.refreshToken),
        user: tokens?.user || null,
        login: apiLogin,
        logout: apiLogout,
        requestLogin: () => router.push('/login'),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);

    return ctx || {
        isAuthed: isAuthed(),
        user: null,
        login: apiLogin,
        logout: apiLogout,
        requestLogin: () => router.push('/login'),
    };
}
