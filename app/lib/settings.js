"use client";

const KEY = "atmusic:settings";

export const DEFAULT_SETTINGS = {
    clickSound: true,
    trackToast: true,
    autoNext: true,
    reduceMotion: false,
    feed: true,
    queue: true,
    subtitles: true,
    feedAutoscroll: true,
    loop: true,
    volume: 1,
};

let cached = null;
const listeners = new Set();
let storageBound = false;

function isWeakDevice() {
    try {
        const cores = navigator.hardwareConcurrency || 8;
        const memory = navigator.deviceMemory || 8;
        return cores <= 4 || memory <= 4;
    } catch {
        return false;
    }
}

function readFromStorage() {
    try {
        const raw = window.localStorage.getItem(KEY);
        if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {}
    const defaults = { ...DEFAULT_SETTINGS };
    if (isWeakDevice()) defaults.reduceMotion = true;
    return defaults;
}

export function getStoredSettings() {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    if (!cached) cached = readFromStorage();
    return cached;
}

export function saveStoredSettings(next) {
    cached = next;
    try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    notify();
}

export function resetStoredSettings() {
    const defaults = { ...DEFAULT_SETTINGS };
    if (typeof window !== "undefined" && isWeakDevice()) defaults.reduceMotion = true;
    cached = defaults;
    try {
        window.localStorage.removeItem(KEY);
    } catch {}
    notify();
}

function notify() {
    for (const cb of listeners) cb();
}

function notifyAll() {
    cached = null;
    notify();
}

export function subscribeSettings(callback) {
    if (!storageBound && typeof window !== "undefined") {
        window.addEventListener("storage", notifyAll);
        storageBound = true;
    }
    listeners.add(callback);
    return () => {
        listeners.delete(callback);

    };
}
