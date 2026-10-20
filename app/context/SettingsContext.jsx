"use client";
import React, { useEffect, useSyncExternalStore } from 'react';
import { MotionConfig } from 'framer-motion';
import {
    DEFAULT_SETTINGS,
    getStoredSettings,
    subscribeSettings,
} from '../lib/settings';

const SettingsContext = React.createContext(null);

export function SettingsProvider({ children }) {
    const settings = useSyncExternalStore(
        subscribeSettings,
        getStoredSettings,
        () => DEFAULT_SETTINGS
    );

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.anim = settings.reduceMotion ? 'off' : 'on';
    }, [settings.reduceMotion]);

    return (
        <SettingsContext.Provider value={settings}>
            <MotionConfig reducedMotion={settings.reduceMotion ? 'always' : 'never'}>
                {children}
            </MotionConfig>
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return React.useContext(SettingsContext) || DEFAULT_SETTINGS;
}
