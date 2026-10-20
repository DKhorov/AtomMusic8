"use client";
import React, { createContext, useContext, useEffect, useSyncExternalStore, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    subscribeAuth, getAuthSnapshot, isAuthed,
    login as apiLogin, logout as apiLogout,
    ensureAvatar,
} from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const tokens = useSyncExternalStore(subscribeAuth, getAuthSnapshot, () => null);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return {
            isAuthed: false,
            user: null,
            login: apiLogin,
            logout: apiLogout,
            requestLogin: () => {
                if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                }
            },
        };
    }

    return ctx || {
        isAuthed: isAuthed(),
        user: null,
        login: apiLogin,
        logout: apiLogout,
        requestLogin: () => {
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        },
    };
}
